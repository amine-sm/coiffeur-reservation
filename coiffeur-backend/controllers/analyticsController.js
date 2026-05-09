const {
    getSmartAnalytics
} = require("../services/analyticsService");

const getAnalyticsDashboard = async (req, res) => {
    try {
        const data = await getSmartAnalytics();

        res.json({
            success: true,
            message: "Analyse intelligente récupérée avec succès",
            data
        });
    } catch (error) {
        console.error("Erreur analyse intelligente :", error);

        res.status(500).json({
            success: false,
            message: "Erreur récupération analyse intelligente",
            error: error.message
        });
    }
};

module.exports = {
    getAnalyticsDashboard
};