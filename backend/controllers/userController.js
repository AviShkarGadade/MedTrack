const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const { sendEmail } = require("../utils/emailService")

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)

  res.status(201).json({
    success: true,
    data: user,
  })
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  await user.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body

  if (!role || !["admin", "faculty", "student"].includes(role)) {
    return next(new ErrorResponse("Please provide a valid role", 400))
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  // Prevent admin from changing their own role
  if (user._id.toString() === req.user.id) {
    return next(new ErrorResponse("You cannot change your own role", 400))
  }

  user.role = role
  await user.save()

  // Send email notification to user
  try {
    await sendEmail({
      email: user.email,
      subject: "Your Account Role Has Been Updated",
      html: `
        <h1>Role Update Notification</h1>
        <p>Dear ${user.name},</p>
        <p>Your account role has been updated to: <strong>${role}</strong></p>
        <p>If you have any questions, please contact the administrator.</p>
        <p>Thank you,<br>MedTrack Team</p>
      `,
    })
  } catch (err) {
    console.error("Email notification failed:", err)
    // Continue even if email fails
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body

  if (!status || !["active", "inactive", "suspended"].includes(status)) {
    return next(new ErrorResponse("Please provide a valid status", 400))
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  // Prevent admin from changing their own status
  if (user._id.toString() === req.user.id) {
    return next(new ErrorResponse("You cannot change your own status", 400))
  }

  user.status = status
  await user.save()

  // Send email notification to user
  try {
    await sendEmail({
      email: user.email,
      subject: "Your Account Status Has Been Updated",
      html: `
        <h1>Account Status Update</h1>
        <p>Dear ${user.name},</p>
        <p>Your account status has been updated to: <strong>${status}</strong></p>
        <p>If you have any questions, please contact the administrator.</p>
        <p>Thank you,<br>MedTrack Team</p>
      `,
    })
  } catch (err) {
    console.error("Email notification failed:", err)
    // Continue even if email fails
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Get student profile
// @route   GET /api/users/student/profile
// @access  Private (Student only)
exports.getStudentProfile = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    data: student,
  })
})

// @desc    Get faculty profile
// @route   GET /api/users/faculty/profile
// @access  Private (Faculty only)
exports.getFacultyProfile = asyncHandler(async (req, res, next) => {
  const faculty = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    data: faculty,
  })
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }

  // Add role-specific fields
  if (req.user.role === "student" && req.body.batch) {
    fieldsToUpdate.batch = req.body.batch
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { notificationPreferences, theme, language } = req.body

  const fieldsToUpdate = {}

  if (notificationPreferences) {
    fieldsToUpdate.notificationPreferences = notificationPreferences
  }

  if (theme) {
    fieldsToUpdate.theme = theme
  }

  if (language) {
    fieldsToUpdate.language = language
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Get admin stats
// @route   GET /api/users/admin/stats
// @access  Private (Admin only)
exports.getAdminStats = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments()
  const totalStudents = await User.countDocuments({ role: "student" })
  const totalFaculty = await User.countDocuments({ role: "faculty" })
  const totalAdmins = await User.countDocuments({ role: "admin" })
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5)

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAdmins,
      recentUsers,
    },
  })
})

