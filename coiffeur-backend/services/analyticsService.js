const pool = require("../config/db");

function getPercentChange(current, previous) {
    const now = Number(current || 0);
    const old = Number(previous || 0);

    if (old === 0 && now === 0) return 0;
    if (old === 0 && now > 0) return 100;

    return Number((((now - old) / old) * 100).toFixed(2));
}

function getCancellationRate(total, cancelled) {
    const totalNumber = Number(total || 0);
    const cancelledNumber = Number(cancelled || 0);

    if (totalNumber === 0) return 0;

    return Number(((cancelledNumber / totalNumber) * 100).toFixed(2));
}

function buildRecommendations(data) {
    const recommendations = [];

    if (data.cancellation_rate >= 20) {
        recommendations.push({
            type: "warning",
            title: "Taux d’annulation élevé",
            message:
                "Le taux d’annulation est élevé. Il est conseillé d’envoyer un rappel Telegram ou email avant le rendez-vous."
        });
    }

    if (data.best_day?.day_name) {
        recommendations.push({
            type: "success",
            title: "Jour le plus chargé",
            message: `Le jour le plus chargé est ${data.best_day.day_name}. Ajoutez plus de créneaux sur cette journée.`
        });
    }

    if (data.weak_day?.day_name) {
        recommendations.push({
            type: "info",
            title: "Jour faible détecté",
            message: `Le jour le plus faible est ${data.weak_day.day_name}. Vous pouvez proposer une promotion ou une offre spéciale.`
        });
    }

    if (data.top_revenue_service?.nom) {
        recommendations.push({
            type: "success",
            title: "Service le plus rentable",
            message: `Le service le plus rentable est "${data.top_revenue_service.nom}". Mettez-le en avant dans la page services.`
        });
    }

    if (data.top_requested_service?.nom) {
        recommendations.push({
            type: "info",
            title: "Service le plus demandé",
            message: `Le service le plus demandé est "${data.top_requested_service.nom}". Prévoyez plus de créneaux pour ce service.`
        });
    }

    if (data.peak_hour?.hour) {
        recommendations.push({
            type: "success",
            title: "Heure la plus demandée",
            message: `L’heure la plus demandée est ${data.peak_hour.hour}. Gardez cette période prioritaire pour les services les plus rentables.`
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            type: "info",
            title: "Analyse stable",
            message:
                "Les données sont stables. Continuez à suivre les réservations pour obtenir des recommandations plus précises."
        });
    }

    return recommendations;
}

async function getRevenueStats() {
    const [[today]] = await pool.query(`
        SELECT COALESCE(SUM(prix), 0) AS total
        FROM rendezvous
        WHERE statut = 'termine'
          AND DATE(date_rdv) = CURDATE()
    `);

    const [[week]] = await pool.query(`
        SELECT COALESCE(SUM(prix), 0) AS total
        FROM rendezvous
        WHERE statut = 'termine'
          AND YEARWEEK(date_rdv, 1) = YEARWEEK(CURDATE(), 1)
    `);

    const [[month]] = await pool.query(`
        SELECT COALESCE(SUM(prix), 0) AS total
        FROM rendezvous
        WHERE statut = 'termine'
          AND YEAR(date_rdv) = YEAR(CURDATE())
          AND MONTH(date_rdv) = MONTH(CURDATE())
    `);

    const [[previousMonth]] = await pool.query(`
        SELECT COALESCE(SUM(prix), 0) AS total
        FROM rendezvous
        WHERE statut = 'termine'
          AND YEAR(date_rdv) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
          AND MONTH(date_rdv) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    `);

    return {
        today: Number(today.total || 0),
        week: Number(week.total || 0),
        month: Number(month.total || 0),
        previous_month: Number(previousMonth.total || 0),
        month_growth_percent: getPercentChange(month.total, previousMonth.total)
    };
}

async function getRendezvousStats() {
    const [[total]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM rendezvous
    `);

    const [[enAttente]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM rendezvous
        WHERE statut = 'en_attente'
    `);

    const [[confirmes]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM rendezvous
        WHERE statut = 'confirme'
    `);

    const [[termines]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM rendezvous
        WHERE statut = 'termine'
    `);

    const [[annules]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM rendezvous
        WHERE statut = 'annule'
    `);

    return {
        total: Number(total.total || 0),
        en_attente: Number(enAttente.total || 0),
        confirmes: Number(confirmes.total || 0),
        termines: Number(termines.total || 0),
        annules: Number(annules.total || 0),
        cancellation_rate: getCancellationRate(total.total, annules.total)
    };
}

async function getTopServices() {
    const [requested] = await pool.query(`
        SELECT 
            s.id,
            s.nom,
            COUNT(r.id) AS total_reservations
        FROM rendezvous r
        LEFT JOIN services s ON s.id = r.service_id
        GROUP BY s.id, s.nom
        ORDER BY total_reservations DESC
        LIMIT 5
    `);

    const [revenue] = await pool.query(`
        SELECT 
            s.id,
            s.nom,
            COUNT(r.id) AS total_rdv,
            COALESCE(SUM(r.prix), 0) AS total_revenue
        FROM rendezvous r
        LEFT JOIN services s ON s.id = r.service_id
        WHERE r.statut = 'termine'
        GROUP BY s.id, s.nom
        ORDER BY total_revenue DESC
        LIMIT 5
    `);

    const [cancelled] = await pool.query(`
        SELECT 
            s.id,
            s.nom,
            COUNT(r.id) AS total_annulations
        FROM rendezvous r
        LEFT JOIN services s ON s.id = r.service_id
        WHERE r.statut = 'annule'
        GROUP BY s.id, s.nom
        ORDER BY total_annulations DESC
        LIMIT 5
    `);

    return {
        requested,
        revenue,
        cancelled,
        top_requested_service: requested[0] || null,
        top_revenue_service: revenue[0] || null,
        top_cancelled_service: cancelled[0] || null
    };
}

async function getDayAnalytics() {
    const [days] = await pool.query(`
        SELECT 
            DAYNAME(date_rdv) AS day_key,
            CASE DAYOFWEEK(date_rdv)
                WHEN 1 THEN 'Dimanche'
                WHEN 2 THEN 'Lundi'
                WHEN 3 THEN 'Mardi'
                WHEN 4 THEN 'Mercredi'
                WHEN 5 THEN 'Jeudi'
                WHEN 6 THEN 'Vendredi'
                WHEN 7 THEN 'Samedi'
            END AS day_name,
            COUNT(*) AS total
        FROM rendezvous
        GROUP BY DAYOFWEEK(date_rdv), DAYNAME(date_rdv)
        ORDER BY total DESC
    `);

    return {
        all_days: days,
        best_day: days[0] || null,
        weak_day: days.length > 0 ? days[days.length - 1] : null
    };
}

async function getHourAnalytics() {
    const [hours] = await pool.query(`
        SELECT 
            TIME_FORMAT(heure_rdv, '%H:%i') AS hour,
            COUNT(*) AS total
        FROM rendezvous
        GROUP BY TIME_FORMAT(heure_rdv, '%H:%i')
        ORDER BY total DESC
    `);

    return {
        all_hours: hours,
        peak_hour: hours[0] || null,
        weak_hour: hours.length > 0 ? hours[hours.length - 1] : null
    };
}

async function getClientAnalytics() {
    const [loyalClients] = await pool.query(`
        SELECT 
            c.id,
            c.nom,
            c.prenom,
            c.telephone,
            c.email,
            COUNT(r.id) AS total_rdv,
            COALESCE(SUM(CASE WHEN r.statut = 'termine' THEN r.prix ELSE 0 END), 0) AS total_depense
        FROM clients c
        LEFT JOIN rendezvous r ON r.client_id = c.id
        GROUP BY c.id, c.nom, c.prenom, c.telephone, c.email
        HAVING total_rdv >= 2
        ORDER BY total_rdv DESC, total_depense DESC
        LIMIT 10
    `);

    return {
        loyal_clients: loyalClients,
        best_client: loyalClients[0] || null
    };
}

async function getCreneauxAnalytics() {
    const [[available]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM creneaux_disponibles
        WHERE statut = 'disponible'
          AND TIMESTAMP(date_creneau, heure_creneau) >= NOW()
    `);

    const [[reserved]] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM creneaux_disponibles
        WHERE statut = 'reserve'
    `);

    return {
        disponibles: Number(available.total || 0),
        reserves: Number(reserved.total || 0)
    };
}

async function getSmartAnalytics() {
    const revenue = await getRevenueStats();
    const rendezvous = await getRendezvousStats();
    const services = await getTopServices();
    const days = await getDayAnalytics();
    const hours = await getHourAnalytics();
    const clients = await getClientAnalytics();
    const creneaux = await getCreneauxAnalytics();

    const dataForRecommendations = {
        cancellation_rate: rendezvous.cancellation_rate,
        best_day: days.best_day,
        weak_day: days.weak_day,
        top_requested_service: services.top_requested_service,
        top_revenue_service: services.top_revenue_service,
        peak_hour: hours.peak_hour
    };

    const recommendations = buildRecommendations(dataForRecommendations);

    return {
        generated_at: new Date().toISOString(),
        revenue,
        rendezvous,
        services,
        days,
        hours,
        clients,
        creneaux,
        recommendations
    };
}

module.exports = {
    getSmartAnalytics
};