const express = require("express");
const router = express.Router();

const {
    getAvailableCreneaux,
    getPublicCreneauxByDate,
    getPublicAvailableDates,
    getAllCreneauxAdmin,
    createCreneau,
    updateCreneau,
    deleteCreneau
} = require("../controllers/creneauController");

const { verifyAdmin } = require("../middleware/authMiddleware");

/*
    Public client
*/
router.get("/disponibles", getAvailableCreneaux);
router.get("/public", getPublicCreneauxByDate);
router.get("/dates-disponibles", getPublicAvailableDates);

/*
    Admin
*/
router.get("/", verifyAdmin, getAllCreneauxAdmin);
router.post("/", verifyAdmin, createCreneau);
router.put("/:id", verifyAdmin, updateCreneau);
router.delete("/:id", verifyAdmin, deleteCreneau);

module.exports = router;