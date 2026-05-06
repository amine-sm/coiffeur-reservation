const express = require("express");
const router = express.Router();

const {
    getAllClients,
    getClientById
} = require("../controllers/clientController");

const { verifyAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyAdmin, getAllClients);
router.get("/:id", verifyAdmin, getClientById);

module.exports = router;