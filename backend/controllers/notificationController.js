const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const Notification = require("../models/Notification")
const User = require("../models/User")

// @desc    Get all notifications for a user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("sender", "name avatar")

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  })
})

// @desc    Create new notification
// @route   POST /api/v1/notifications
// @access  Private (Admin only)
exports.createNotification = asyncHandler(async (req, res, next) => {
  // Add user id to req.body
  req.body.sender = req.user.id

  // Check if recipients is provided
  if (!req.body.recipients && !req.body.recipientGroups) {
    return next(new ErrorResponse("Please provide recipients or recipient groups", 400))
  }

  let recipients = []

  // If specific recipients are provided
  if (req.body.recipients && req.body.recipients.length > 0) {
    recipients = [...req.body.recipients]
  }

  // If recipient groups are provided (e.g., 'all', 'students', 'faculty')
  if (req.body.recipientGroups && req.body.recipientGroups.length > 0) {
    const groups = req.body.recipientGroups

    let userQuery = {}

    if (groups.includes("students")) {
      userQuery.role = "student"
    } else if (groups.includes("faculty")) {
      userQuery.role = "faculty"
    } else if (groups.includes("admins")) {
      userQuery.role = "admin"
    }

    // If 'all' is included, we don't need to filter by role
    if (groups.includes("all")) {
      userQuery = {}
    }

    const users = await User.find(userQuery).select("_id")
    const userIds = users.map((user) => user._id.toString())

    // Add unique user IDs to recipients
    recipients = [...new Set([...recipients, ...userIds])]
  }

  // Create notifications for each recipient
  const notifications = []
  for (const recipient of recipients) {
    const notificationData = {
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || "info",
      user: recipient,
      sender: req.user.id,
    }

    notifications.push(notificationData)
  }

  await Notification.insertMany(notifications)

  res.status(201).json({
    success: true,
    count: notifications.length,
    message: `Notification sent to ${notifications.length} recipients`,
  })
})

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id)

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404))
  }

  // Make sure user owns notification
  if (notification.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this notification`, 401))
  }

  notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    {
      new: true,
      runValidators: true,
    },
  )

  res.status(200).json({
    success: true,
    data: notification,
  })
})

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true })

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  })
})

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id)

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404))
  }

  // Make sure user owns notification
  if (notification.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this notification`, 401))
  }

  await notification.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

