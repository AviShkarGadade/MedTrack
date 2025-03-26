const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const Session = require("../models/Session")
const Attendance = require("../models/Attendance")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const QRCode = require("qrcode")
const crypto = require("crypto")
const { sendEmail } = require("../utils/emailService")
const { generateAttendanceVerificationEmail } = require("../utils/emailTemplates")
const geolib = require("geolib")
const { sendAttendanceVerificationEmail } = require("../utils/emailService")

// @desc    Get all sessions
// @route   GET /api/attendance/sessions
// @access  Private
exports.getSessions = asyncHandler(async (req, res, next) => {
  let query

  // Copy req.query
  const reqQuery = { ...req.query }

  // Fields to exclude
  const removeFields = ["select", "sort", "page", "limit"]

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param])

  // Create query string
  let queryStr = JSON.stringify(reqQuery)

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)

  // Finding resource
  if (req.user.role === "faculty") {
    query = Session.find({
      faculty: req.user.id,
      ...JSON.parse(queryStr),
    })
  } else if (req.user.role === "student") {
    // Find sessions where the student has marked attendance
    const attendances = await Attendance.find({ student: req.user.id })
    const sessionIds = attendances.map((att) => att.session)
    query = Session.find({
      _id: { $in: sessionIds },
      ...JSON.parse(queryStr),
    })
  } else {
    query = Session.find(JSON.parse(queryStr))
  }

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ")
    query = query.select(fields)
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ")
    query = query.sort(sortBy)
  } else {
    query = query.sort("-date")
  }

  // Pagination
  const page = Number.parseInt(req.query.page, 10) || 1
  const limit = Number.parseInt(req.query.limit, 10) || 25
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await Session.countDocuments(query)

  query = query.skip(startIndex).limit(limit)

  // Populate
  query = query.populate([
    {
      path: "faculty",
      select: "name email",
    },
    {
      path: "hospital",
      select: "name location",
    },
  ])

  // Executing query
  const sessions = await query

  // Pagination result
  const pagination = {}

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  res.status(200).json({
    success: true,
    count: sessions.length,
    pagination,
    data: sessions,
  })
})

// @desc    Get single session
// @route   GET /api/attendance/sessions/:id
// @access  Private
exports.getSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id).populate([
    {
      path: "faculty",
      select: "name email",
    },
    {
      path: "hospital",
      select: "name location",
    },
  ])

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404))
  }

  // Get attendances for this session
  const attendances = await Attendance.find({ session: session._id }).populate({
    path: "student",
    select: "name email",
  })

  res.status(200).json({
    success: true,
    data: {
      session,
      attendances,
    },
  })
})

// @desc    Create new session
// @route   POST /api/attendance/sessions
// @access  Private/Faculty/Admin
exports.createSession = asyncHandler(async (req, res, next) => {
  // Add faculty to req.body
  req.body.faculty = req.user.id

  // Check if hospital exists
  const hospital = await Hospital.findById(req.body.hospital)
  if (!hospital) {
    return next(new ErrorResponse(`Hospital not found with id of ${req.body.hospital}`, 404))
  }

  const session = await Session.create(req.body)

  res.status(201).json({
    success: true,
    data: session,
  })
})

// @desc    Update session
// @route   PUT /api/attendance/sessions/:id
// @access  Private/Faculty/Admin
exports.updateSession = asyncHandler(async (req, res, next) => {
  let session = await Session.findById(req.params.id)

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is session faculty or admin
  if (session.faculty.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this session`, 401))
  }

  session = await Session.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: session,
  })
})

// @desc    Delete session
// @route   DELETE /api/attendance/sessions/:id
// @access  Private/Faculty/Admin
exports.deleteSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is session faculty or admin
  if (session.faculty.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this session`, 401))
  }

  // Delete all attendances for this session
  await Attendance.deleteMany({ session: session._id })

  await session.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Create a new attendance session
// @route   POST /api/attendance/sessions
// @access  Private (Faculty only)
exports.createAttendanceSession = asyncHandler(async (req, res, next) => {
  const { title, description, hospitalId, departmentId, duration } = req.body

  // Validate required fields
  if (!title || !hospitalId || !departmentId) {
    return next(new ErrorResponse("Please provide title, hospital, and department", 400))
  }

  // Verify hospital and department exist
  const hospital = await Hospital.findById(hospitalId)
  if (!hospital) {
    return next(new ErrorResponse("Hospital not found", 404))
  }

  const department = hospital.departments.id(departmentId)
  if (!department) {
    return next(new ErrorResponse("Department not found", 404))
  }

  // Generate a unique code for the session
  const sessionCode = crypto.randomBytes(3).toString("hex").toUpperCase()

  // Create QR code data with session information
  const qrData = JSON.stringify({
    sessionCode,
    facultyId: req.user.id,
    hospitalId,
    departmentId,
    timestamp: Date.now(),
  })

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(qrData)

  // Calculate end time based on duration (default to 1 hour if not specified)
  const sessionDuration = duration || 60
  const endTime = new Date(Date.now() + sessionDuration * 60000)

  // Create the session
  const session = await Session.create({
    title,
    description,
    faculty: req.user.id,
    hospital: hospitalId,
    department: departmentId,
    sessionCode,
    qrCode: qrCodeDataUrl,
    endTime,
    location: hospital.location,
  })

  res.status(201).json({
    success: true,
    data: session,
  })
})

// @desc    Get active sessions for faculty
// @route   GET /api/attendance/sessions/active
// @access  Private (Faculty only)
exports.getActiveSessions = asyncHandler(async (req, res, next) => {
  const sessions = await Session.find({
    faculty: req.user.id,
    endTime: { $gt: new Date() },
    isActive: true,
  })
    .populate("hospital", "name")
    .populate("department", "name")

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions,
  })
})

// @desc    End an attendance session
// @route   PUT /api/attendance/sessions/:id/end
// @access  Private (Faculty only)
exports.endAttendanceSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404))
  }

  // Make sure user is the session owner
  if (session.faculty.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to end this session", 401))
  }

  session.isActive = false
  session.endTime = new Date()
  await session.save()

  res.status(200).json({
    success: true,
    data: session,
  })
})

// @desc    Mark attendance for a session
// @route   POST /api/attendance/mark/:sessionId
// @access  Private/Student
exports.markAttendance = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.sessionId)

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.sessionId}`, 404))
  }

  // Check if student has already marked attendance
  const existingAttendance = await Attendance.findOne({
    session: req.params.sessionId,
    student: req.user.id,
  })

  if (existingAttendance) {
    return next(new ErrorResponse(`You have already marked attendance for this session`, 400))
  }

  // Create attendance
  const attendance = await Attendance.create({
    session: req.params.sessionId,
    student: req.user.id,
    location: req.body.location,
    verified: false,
  })

  // Get faculty email
  const faculty = await User.findById(session.faculty)

  // Send verification email to faculty
  if (faculty && faculty.email) {
    try {
      const student = await User.findById(req.user.id)
      const hospital = await Hospital.findById(session.hospital)

      await sendAttendanceVerificationEmail({
        facultyEmail: faculty.email,
        facultyName: faculty.name,
        studentName: student.name,
        studentEmail: student.email,
        sessionDate: session.date,
        hospitalName: hospital.name,
        attendanceId: attendance._id,
      })
    } catch (err) {
      console.log("Email sending failed", err)
    }
  }

  res.status(201).json({
    success: true,
    data: attendance,
  })
})

// @desc    Verify attendance
// @route   PUT /api/attendance/verify/:attendanceId
// @access  Private/Faculty/Admin
exports.verifyAttendance = asyncHandler(async (req, res, next) => {
  let attendance = await Attendance.findById(req.params.attendanceId)

  if (!attendance) {
    return next(new ErrorResponse(`Attendance not found with id of ${req.params.attendanceId}`, 404))
  }

  // Get the session
  const session = await Session.findById(attendance.session)

  // Make sure user is session faculty or admin
  if (session.faculty.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to verify this attendance`, 401))
  }

  attendance = await Attendance.findByIdAndUpdate(
    req.params.attendanceId,
    { verified: true },
    {
      new: true,
      runValidators: true,
    },
  )

  res.status(200).json({
    success: true,
    data: attendance,
  })
})

// @desc    Get student attendance
// @route   GET /api/attendance/student
// @access  Private/Student
exports.getStudentAttendance = asyncHandler(async (req, res, next) => {
  const attendances = await Attendance.find({ student: req.user.id }).populate({
    path: "session",
    populate: [
      {
        path: "faculty",
        select: "name email",
      },
      {
        path: "hospital",
        select: "name location",
      },
    ],
  })

  res.status(200).json({
    success: true,
    count: attendances.length,
    data: attendances,
  })
})

// @desc    Get faculty attendance
// @route   GET /api/attendance/faculty
// @access  Private/Faculty
exports.getFacultyAttendance = asyncHandler(async (req, res, next) => {
  // Get all sessions by faculty
  const sessions = await Session.find({ faculty: req.user.id })

  // Get all attendances for these sessions
  const sessionIds = sessions.map((session) => session._id)

  const attendances = await Attendance.find({ session: { $in: sessionIds } })
    .populate({
      path: "student",
      select: "name email",
    })
    .populate({
      path: "session",
      populate: {
        path: "hospital",
        select: "name location",
      },
    })

  res.status(200).json({
    success: true,
    count: attendances.length,
    data: attendances,
  })
})

