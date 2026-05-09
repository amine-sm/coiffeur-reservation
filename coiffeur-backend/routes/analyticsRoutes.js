const express = require("express");

const {
    getAnalyticsDashboard
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/", getAnalyticsDashboard);

module.exports = router;