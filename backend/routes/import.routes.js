const express = require("express")
const { bulkImportUsers, downloadImportTemplate } = require("../controllers/import.controller")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply protection to all routes
router.use(protect)
router.use(authorize("admin"))

// Import routes
router.post("/users", bulkImportUsers)
router.get("/template/:role", downloadImportTemplate)

module.exports = router

