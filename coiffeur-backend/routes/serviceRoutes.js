const express = require("express");
const router = express.Router();

const {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
} = require("../controllers/serviceController");

const { verifyAdmin } = require("../middleware/authMiddleware");

router.get("/", getAllServices);
router.get("/:id", getServiceById);

router.post("/", verifyAdmin, createService);
router.put("/:id", verifyAdmin, updateService);
router.delete("/:id", verifyAdmin, deleteService);

module.exports = router;