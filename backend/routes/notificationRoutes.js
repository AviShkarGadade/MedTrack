const express = require("express")
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController")

const router = express.Router()

const { protect, authorize } = require("../middleware/auth")

// Apply protection to all routes
router.use(protect)

// Routes
router.route("/").get(getNotifications).post(authorize("admin"), createNotification)

router.route("/read-all").put(markAllAsRead)

router.route("/:id/read").put(markAsRead)

router.route("/:id").delete(deleteNotification)

module.exports = router

