const express = require("express")
const {
  getAnalyticsOverview,
  getAttendanceTrends,
  getHospitalAnalytics,
  getStudentPerformance,
} = require("../controllers/analytics.controller")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Admin only routes
router.get("/overview", authorize("admin"), getAnalyticsOverview)
router.get("/hospitals", authorize("admin"), getHospitalAnalytics)

// Admin and faculty routes
router.get("/attendance-trends", authorize("admin", "faculty"), getAttendanceTrends)
router.get("/student-performance", authorize("admin", "faculty"), getStudentPerformance)

module.exports = router

