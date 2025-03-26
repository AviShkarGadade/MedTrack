const express = require("express")
const {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  addDepartment,
  removeDepartment,
} = require("../controllers/hospital.controller")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Public routes (for authenticated users)
router.get("/", getHospitals)
router.get("/:id", getHospital)

// Admin only routes
router.post("/", authorize("admin"), createHospital)
router.put("/:id", authorize("admin"), updateHospital)
router.delete("/:id", authorize("admin"), deleteHospital)
router.post("/:id/departments", authorize("admin"), addDepartment)
router.delete("/:id/departments/:departmentName", authorize("admin"), removeDepartment)

module.exports = router

