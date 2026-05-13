const express = require("express");

const {
  getAnalyticsDashboard,
} = require("../controllers/analyticsController");

const router = express.Router();

// GET /api/analytics
router.get("/", getAnalyticsDashboard);

// GET /api/analytics/smart
router.get("/smart", getAnalyticsDashboard);

module.exports = router;