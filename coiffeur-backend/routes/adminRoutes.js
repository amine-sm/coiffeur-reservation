const express = require("express");
const router = express.Router();

const {
    registerAdmin,
    loginAdmin,
    getDashboardStats
} = require("../controllers/adminController");

const { verifyAdmin } = require("../middleware/authMiddleware");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/stats", verifyAdmin, getDashboardStats);

module.exports = router;