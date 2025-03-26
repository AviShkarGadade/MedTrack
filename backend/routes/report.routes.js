const express = require("express")
const {
  generateStudentReport,
  generateFacultyReport,
  generateHospitalReport,
  generateStudentsSummaryReport,
} = require("../controllers/report.controller")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Student report routes
router.get("/student/:studentId", generateStudentReport)

// Faculty report routes
router.get("/faculty/:facultyId", authorize("admin", "faculty"), generateFacultyReport)

// Hospital report routes
router.get("/hospital/:hospitalId", authorize("admin"), generateHospitalReport)

// Students summary report
router.get("/students-summary", authorize("admin", "faculty"), generateStudentsSummaryReport)

module.exports = router

