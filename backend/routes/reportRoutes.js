const express = require("express")
const {
  getUserAttendanceReport,
  getSessionAttendanceReport,
  getHospitalAttendanceReport,
  exportUserAttendanceReportCSV,
  exportUserAttendanceReportPDF,
  getOverallStatistics,
} = require("../controllers/reportController")

const router = express.Router()

const { protect, authorize } = require("../middleware/auth")

// Protect all routes
router.use(protect)

// Get user attendance report
router.get("/user/:userId", getUserAttendanceReport)

// Get session attendance report
router.route("/session/:sessionId").get(authorize("admin", "faculty"), getSessionAttendanceReport)

// Get hospital attendance report
router.route("/hospital/:hospitalId").get(authorize("admin", "faculty"), getHospitalAttendanceReport)

// Export user attendance report as CSV
router.get("/user/:userId/export/csv", exportUserAttendanceReportCSV)

// Export user attendance report as PDF
router.get("/user/:userId/export/pdf", exportUserAttendanceReportPDF)

// Get overall statistics
router.get("/statistics", authorize("admin", "faculty"), getOverallStatistics)

module.exports = router

