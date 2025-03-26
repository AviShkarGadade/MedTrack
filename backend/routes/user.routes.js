const express = require("express")
const {
  getUsers,
  getStudentProfile,
  getFacultyProfile,
  updateProfile,
  getAdminStats,
} = require("../controllers/user.controller")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Admin routes
router.get("/", authorize("admin"), getUsers)
router.get("/admin/stats", authorize("admin"), getAdminStats)

// Student routes
router.get("/student/profile", authorize("student"), getStudentProfile)

// Faculty routes
router.get("/faculty/profile", authorize("faculty"), getFacultyProfile)

// Common routes
router.put("/profile", updateProfile)

module.exports = router

