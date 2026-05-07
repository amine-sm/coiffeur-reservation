const express = require("express");
const router = express.Router();

const {
    createRendezvous,
    getAllRendezvous,
    getRendezvousById,
    updateRendezvousStatut,
    deleteRendezvous,
    cleanExpiredRendezvous
} = require("../controllers/rendezvousController");

router.get("/", getAllRendezvous);
router.post("/", createRendezvous);

router.delete("/expired/clean", cleanExpiredRendezvous);

router.get("/:id", getRendezvousById);
router.patch("/:id/statut", updateRendezvousStatut);
router.delete("/:id", deleteRendezvous);

module.exports = router;