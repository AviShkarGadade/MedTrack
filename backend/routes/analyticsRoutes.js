const express = require("express")
const {
  getAttendanceAnalytics,
  getUserAnalytics,
  getHospitalAnalytics,
  getFacultyAnalytics,
  getDashboardStats,
} = require("../controllers/analyticsController")

const router = express.Router()

const { protect, authorize } = require("../middleware/auth")

// Protect all routes
router.use(protect)
router.use(authorize("admin", "faculty"))

// Get attendance analytics
router.get("/attendance", getAttendanceAnalytics)

// Get user analytics
router.get("/users", getUserAnalytics)

// Get hospital analytics
router.get("/hospitals", getHospitalAnalytics)

// Get faculty analytics
router.get("/faculty", getFacultyAnalytics)

// Get dashboard stats
router.get("/dashboard", getDashboardStats)

module.exports = router

