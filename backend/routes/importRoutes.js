const express = require("express")
const { importUsers, importHospitals, getImportStatus } = require("../controllers/importController")

const router = express.Router()

const { protect, authorize } = require("../middleware/auth")

// Protect all routes
router.use(protect)
router.use(authorize("admin"))

// Import users
router.post("/users", importUsers)

// Import hospitals
router.post("/hospitals", importHospitals)

// Get import status
router.get("/status/:importId", getImportStatus)

module.exports = router

