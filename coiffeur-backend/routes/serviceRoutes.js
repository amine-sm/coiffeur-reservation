const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
} = require("../controllers/serviceController");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/services");
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const fileFilter = function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Format image invalide. Utilisez JPG, PNG ou WEBP."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.get("/", getAllServices);
router.get("/:id", getServiceById);

router.post("/", upload.single("image"), createService);
router.put("/:id", upload.single("image"), updateService);

router.delete("/:id", deleteService);

module.exports = router;