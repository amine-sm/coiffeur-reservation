const pool = require("../config/db");

function toMinutes(time) {
    const [hours, minutes] = String(time).split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

async function reserveCreneauxByDuration(connection, dateRdv, heureDebut, duree) {
    const start = toMinutes(heureDebut);
    const end = start + Number(duree || 0);

    await connection.query(
        `
        UPDATE creneaux_disponibles
        SET statut = 'reserve'
        WHERE date_creneau = ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') >= ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') < ?
        `,
        [dateRdv, minutesToTime(start), minutesToTime(end)]
    );
}

async function libererCreneauxByDuration(connection, dateRdv, heureDebut, duree) {
    const start = toMinutes(heureDebut);
    const end = start + Number(duree || 0);

    await connection.query(
        `
        UPDATE creneaux_disponibles
        SET statut = 'disponible'
        WHERE date_creneau = ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') >= ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') < ?
        `,
        [dateRdv, minutesToTime(start), minutesToTime(end)]
    );
}

async function getRendezvousDetails(connection, id, forUpdate = false) {
    const [rows] = await connection.query(
        `
        SELECT 
            r.id,
            r.client_id,
            r.nom_client,
            r.prenom_client,
            r.email,
            r.telephone,
            r.service_id,
            r.creneau_id,
            r.telegram_chat_id,
            cl.telegram_chat_id AS client_telegram_chat_id,
            DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
            TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
            r.statut,
            r.prix,
            r.note,
            s.nom AS service_nom,
            s.duree AS service_duree
        FROM rendezvous r
        LEFT JOIN services s ON s.id = r.service_id
        LEFT JOIN clients cl ON cl.id = r.client_id
        WHERE r.id = ?
        ${forUpdate ? "FOR UPDATE" : ""}
        `,
        [id]
    );

    return rows[0] || null;
}

async function changeRendezvousStatus(id, statut) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const statutsAutorises = ["en_attente", "confirme", "termine", "annule"];

        if (!statut || !statutsAutorises.includes(statut)) {
            const error = new Error("Statut invalide");
            error.statusCode = 400;
            throw error;
        }

        const rdv = await getRendezvousDetails(connection, id, true);

        if (!rdv) {
            const error = new Error("Rendez-vous introuvable");
            error.statusCode = 404;
            throw error;
        }

        await connection.query(
            "UPDATE rendezvous SET statut = ? WHERE id = ?",
            [statut, id]
        );

        if (statut === "annule") {
            await libererCreneauxByDuration(
                connection,
                rdv.date_rdv,
                rdv.heure_rdv,
                rdv.service_duree
            );
        }

        if (
            statut === "confirme" ||
            statut === "termine" ||
            statut === "en_attente"
        ) {
            await reserveCreneauxByDuration(
                connection,
                rdv.date_rdv,
                rdv.heure_rdv,
                rdv.service_duree
            );
        }

        const updatedRdv = await getRendezvousDetails(connection, id, false);

        await connection.commit();

        return updatedRdv;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    changeRendezvousStatus,
    getRendezvousDetails,
    reserveCreneauxByDuration,
    libererCreneauxByDuration
};