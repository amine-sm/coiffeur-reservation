const express = require("express");
const router = express.Router();

const {
    createRendezvous,
    getAllRendezvous,
    getRendezvousById,
    updateRendezvousStatut,
    deleteRendezvous
} = require("../controllers/rendezvousController");

const { verifyAdmin } = require("../middleware/authMiddleware");

/*
    Public client
*/
router.post("/", createRendezvous);

/*
    Admin
*/
router.get("/", verifyAdmin, getAllRendezvous);
router.get("/:id", verifyAdmin, getRendezvousById);
router.patch("/:id/statut", verifyAdmin, updateRendezvousStatut);
router.delete("/:id", verifyAdmin, deleteRendezvous);

module.exports = router;