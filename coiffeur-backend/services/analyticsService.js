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

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function getDateFilter(params = {}, alias = "") {
  const startDate = params.startDate;
  const endDate = params.endDate;

  const prefix = alias ? `${alias}.` : "";

  if (isValidDate(startDate) && isValidDate(endDate)) {
    return {
      clause: ` AND DATE(${prefix}date_rdv) BETWEEN ? AND ? `,
      params: [startDate, endDate],
      hasFilter: true,
    };
  }

  return {
    clause: "",
    params: [],
    hasFilter: false,
  };
}

function buildRecommendations(data) {
  const recommendations = [];

  if (data.cancellation_rate >= 20) {
    recommendations.push({
      type: "warning",
      title: "Taux d’annulation élevé",
      message:
        "Le taux d’annulation est élevé. Il est conseillé d’envoyer un rappel Telegram ou email avant le rendez-vous.",
    });
  }

  if (data.best_day?.day_name) {
    recommendations.push({
      type: "success",
      title: "Jour le plus chargé",
      message: `Le jour le plus chargé est ${data.best_day.day_name}. Ajoutez plus de créneaux sur cette journée.`,
    });
  }

  if (data.weak_day?.day_name) {
    recommendations.push({
      type: "info",
      title: "Jour faible détecté",
      message: `Le jour le plus faible est ${data.weak_day.day_name}. Vous pouvez proposer une promotion ou une offre spéciale.`,
    });
  }

  if (data.top_revenue_service?.nom) {
    recommendations.push({
      type: "success",
      title: "Service le plus rentable",
      message: `Le service le plus rentable est "${data.top_revenue_service.nom}". Mettez-le en avant dans la page services.`,
    });
  }

  if (data.top_requested_service?.nom) {
    recommendations.push({
      type: "info",
      title: "Service le plus demandé",
      message: `Le service le plus demandé est "${data.top_requested_service.nom}". Prévoyez plus de créneaux pour ce service.`,
    });
  }

  if (data.peak_hour?.hour) {
    recommendations.push({
      type: "success",
      title: "Heure la plus demandée",
      message: `L’heure la plus demandée est ${data.peak_hour.hour}. Gardez cette période prioritaire pour les services les plus rentables.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "info",
      title: "Analyse stable",
      message:
        "Les données sont stables. Continuez à suivre les réservations pour obtenir des recommandations plus précises.",
    });
  }

  return recommendations;
}

async function getRevenueStats(params = {}) {
  const filter = getDateFilter(params);

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

  const [[period]] = await pool.query(
    `
    SELECT COALESCE(SUM(prix), 0) AS total
    FROM rendezvous
    WHERE statut = 'termine'
    ${filter.clause}
    `,
    filter.params
  );

  let previousPeriodTotal = 0;

  if (filter.hasFilter) {
    const [[previousPeriod]] = await pool.query(
      `
      SELECT COALESCE(SUM(prix), 0) AS total
      FROM rendezvous
      WHERE statut = 'termine'
        AND DATE(date_rdv) BETWEEN DATE_SUB(?, INTERVAL DATEDIFF(?, ?) + 1 DAY)
        AND DATE_SUB(?, INTERVAL 1 DAY)
      `,
      [params.startDate, params.endDate, params.startDate, params.startDate]
    );

    previousPeriodTotal = Number(previousPeriod.total || 0);
  } else {
    const [[previousMonth]] = await pool.query(`
      SELECT COALESCE(SUM(prix), 0) AS total
      FROM rendezvous
      WHERE statut = 'termine'
        AND YEAR(date_rdv) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(date_rdv) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    `);

    previousPeriodTotal = Number(previousMonth.total || 0);
  }

  return {
    today: Number(today.total || 0),
    week: Number(week.total || 0),
    month: Number(period.total || 0),
    previous_month: previousPeriodTotal,
    month_growth_percent: getPercentChange(period.total, previousPeriodTotal),
  };
}

async function getRendezvousStats(params = {}) {
  const filter = getDateFilter(params);

  const [[total]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rendezvous
    WHERE 1 = 1
    ${filter.clause}
    `,
    filter.params
  );

  const [[enAttente]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rendezvous
    WHERE statut = 'en_attente'
    ${filter.clause}
    `,
    filter.params
  );

  const [[confirmes]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rendezvous
    WHERE statut = 'confirme'
    ${filter.clause}
    `,
    filter.params
  );

  const [[termines]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rendezvous
    WHERE statut = 'termine'
    ${filter.clause}
    `,
    filter.params
  );

  const [[annules]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM rendezvous
    WHERE statut = 'annule'
    ${filter.clause}
    `,
    filter.params
  );

  return {
    total: Number(total.total || 0),
    en_attente: Number(enAttente.total || 0),
    confirmes: Number(confirmes.total || 0),
    termines: Number(termines.total || 0),
    annules: Number(annules.total || 0),
    cancellation_rate: getCancellationRate(total.total, annules.total),
  };
}

async function getTopServices(params = {}) {
  const filter = getDateFilter(params, "r");

  const [requested] = await pool.query(
    `
    SELECT 
      s.id,
      s.nom,
      COUNT(r.id) AS total_reservations
    FROM rendezvous r
    LEFT JOIN services s ON s.id = r.service_id
    WHERE 1 = 1
    ${filter.clause}
    GROUP BY s.id, s.nom
    ORDER BY total_reservations DESC
    LIMIT 5
    `,
    filter.params
  );

  const [revenue] = await pool.query(
    `
    SELECT 
      s.id,
      s.nom,
      COUNT(r.id) AS total_rdv,
      COALESCE(SUM(r.prix), 0) AS total_revenue
    FROM rendezvous r
    LEFT JOIN services s ON s.id = r.service_id
    WHERE r.statut = 'termine'
    ${filter.clause}
    GROUP BY s.id, s.nom
    ORDER BY total_revenue DESC
    LIMIT 5
    `,
    filter.params
  );

  const [cancelled] = await pool.query(
    `
    SELECT 
      s.id,
      s.nom,
      COUNT(r.id) AS total_annulations
    FROM rendezvous r
    LEFT JOIN services s ON s.id = r.service_id
    WHERE r.statut = 'annule'
    ${filter.clause}
    GROUP BY s.id, s.nom
    ORDER BY total_annulations DESC
    LIMIT 5
    `,
    filter.params
  );

  return {
    requested,
    revenue,
    cancelled,
    top_requested_service: requested[0] || null,
    top_revenue_service: revenue[0] || null,
    top_cancelled_service: cancelled[0] || null,
  };
}

async function getDayAnalytics(params = {}) {
  const filter = getDateFilter(params);

  const [days] = await pool.query(
    `
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
    WHERE 1 = 1
    ${filter.clause}
    GROUP BY DAYOFWEEK(date_rdv), DAYNAME(date_rdv)
    ORDER BY total DESC
    `,
    filter.params
  );

  return {
    all_days: days,
    best_day: days[0] || null,
    weak_day: days.length > 0 ? days[days.length - 1] : null,
  };
}

async function getHourAnalytics(params = {}) {
  const filter = getDateFilter(params);

  const [hours] = await pool.query(
    `
    SELECT 
      TIME_FORMAT(heure_rdv, '%H:%i') AS hour,
      COUNT(*) AS total
    FROM rendezvous
    WHERE 1 = 1
    ${filter.clause}
    GROUP BY TIME_FORMAT(heure_rdv, '%H:%i')
    ORDER BY total DESC
    `,
    filter.params
  );

  return {
    all_hours: hours,
    peak_hour: hours[0] || null,
    weak_hour: hours.length > 0 ? hours[hours.length - 1] : null,
  };
}

async function getClientAnalytics(params = {}) {
  const filter = getDateFilter(params, "r");

  const [loyalClients] = await pool.query(
    `
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
    WHERE 1 = 1
    ${filter.clause}
    GROUP BY c.id, c.nom, c.prenom, c.telephone, c.email
    HAVING total_rdv >= 2
    ORDER BY total_rdv DESC, total_depense DESC
    LIMIT 10
    `,
    filter.params
  );

  return {
    loyal_clients: loyalClients,
    best_client: loyalClients[0] || null,
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
    reserves: Number(reserved.total || 0),
  };
}

async function getSmartAnalytics(params = {}) {
  const revenue = await getRevenueStats(params);
  const rendezvous = await getRendezvousStats(params);
  const services = await getTopServices(params);
  const days = await getDayAnalytics(params);
  const hours = await getHourAnalytics(params);
  const clients = await getClientAnalytics(params);
  const creneaux = await getCreneauxAnalytics();

  const dataForRecommendations = {
    cancellation_rate: rendezvous.cancellation_rate,
    best_day: days.best_day,
    weak_day: days.weak_day,
    top_requested_service: services.top_requested_service,
    top_revenue_service: services.top_revenue_service,
    peak_hour: hours.peak_hour,
  };

  const recommendations = buildRecommendations(dataForRecommendations);

  return {
    generated_at: new Date().toISOString(),
    filters: {
      startDate: params.startDate || null,
      endDate: params.endDate || null,
    },
    revenue,
    rendezvous,
    services,
    days,
    hours,
    clients,
    creneaux,
    recommendations,
  };
}

module.exports = {
  getSmartAnalytics,
};