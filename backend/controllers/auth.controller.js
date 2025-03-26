const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const emailService = require("../utils/emailService")

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, facultyId, department, batch } = req.body

    // Validate role-specific fields
    if (role === "student" && !studentId) {
      return next(new ErrorResponse("Student ID is required for student accounts", 400))
    }

    if (role === "faculty" && !facultyId) {
      return next(new ErrorResponse("Faculty ID is required for faculty accounts", 400))
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      ...(role === "student" && { studentId, batch }),
      ...(role === "faculty" && { facultyId, department }),
    })

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch((err) => {
      console.error("Failed to send welcome email:", err)
    })

    sendTokenResponse(user, 201, res)
  } catch (err) {
    next(err)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse("Please provide an email and password", 400))
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401))
    }

    // Check if role matches
    if (role && user.role !== role) {
      return next(new ErrorResponse("Invalid credentials for this role", 401))
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401))
    }

    sendTokenResponse(user, 200, res)
  } catch (err) {
    next(err)
  }
}

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (err) {
    next(err)
  }
}

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === "production") {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.studentId && { studentId: user.studentId }),
        ...(user.facultyId && { facultyId: user.facultyId }),
        ...(user.department && { department: user.department }),
        ...(user.batch && { batch: user.batch }),
      },
    })
}

