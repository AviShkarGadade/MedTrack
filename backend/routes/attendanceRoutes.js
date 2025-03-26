const express = require("express")
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  markAttendance,
  getStudentAttendance,
  getFacultyAttendance,
  verifyAttendance,
} = require("../controllers/attendanceController")

const router = express.Router()

const { protect, authorize } = require("../middleware/auth")

router.use(protect)

// Session routes
router.route("/sessions").get(getSessions).post(authorize("faculty", "admin"), createSession)

router
  .route("/sessions/:id")
  .get(getSession)
  .put(authorize("faculty", "admin"), updateSession)
  .delete(authorize("faculty", "admin"), deleteSession)

// Attendance routes
router.post("/mark/:sessionId", markAttendance)
router.put("/verify/:attendanceId", authorize("faculty", "admin"), verifyAttendance)
router.get("/student", authorize("student"), getStudentAttendance)
router.get("/faculty", authorize("faculty"), getFacultyAttendance)

module.exports = router

