const express = require("express")
const {
  createAttendanceSession,
  getActiveSessions,
  getPendingAttendance,
  verifyAttendance,
  markAttendance,
  getStudentAttendance,
  endAttendanceSession,
} = require("../controllers/attendance.controller")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Faculty routes
router.post("/sessions", authorize("faculty"), createAttendanceSession)
router.get("/sessions/active", authorize("faculty"), getActiveSessions)
router.get("/pending", authorize("faculty"), getPendingAttendance)
router.put("/verify/:sessionId/:studentId", authorize("faculty"), verifyAttendance)
router.put("/sessions/:id/end", authorize("faculty"), endAttendanceSession)

// Student routes
router.post("/mark", authorize("student"), markAttendance)
router.get("/student", authorize("student"), getStudentAttendance)

module.exports = router

