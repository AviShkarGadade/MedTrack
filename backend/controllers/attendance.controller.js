const crypto = require("crypto")
const qrcode = require("qrcode")
const AttendanceSession = require("../models/AttendanceSession")
const Attendance = require("../models/Attendance")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const ErrorResponse = require("../utils/errorResponse")
const emailService = require("../utils/emailService")
const locationVerifier = require("../utils/locationVerifier")

// @desc    Create attendance session
// @route   POST /api/attendance/sessions
// @access  Private/Faculty
exports.createAttendanceSession = async (req, res, next) => {
  try {
    const { hospitalId, department, duration = 60 } = req.body

    // Validate hospital and department
    const hospital = await Hospital.findById(hospitalId)

    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found with id of ${hospitalId}`, 404))
    }

    if (!hospital.departments.includes(department)) {
      return next(new ErrorResponse(`Department ${department} not found in this hospital`, 404))
    }

    // Calculate expiration time
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + Number.parseInt(duration))

    // Generate a unique session ID
    const sessionId = crypto.randomBytes(16).toString("hex")

    // Create QR code data
    const qrData = JSON.stringify({
      sessionId,
      hospitalId,
      department,
      facultyId: req.user.id,
      timestamp: Date.now(),
    })

    // Generate QR code
    const qrCode = await qrcode.toDataURL(qrData)

    // Get faculty information
    const faculty = await User.findById(req.user.id)

    // Create session
    const session = await AttendanceSession.create({
      hospital: hospitalId,
      department,
      faculty: req.user.id,
      expiresAt,
      qrCode,
    })

    // Get students for automatic enrollment
    const students = await User.find({ role: "student" })

    // Create pending attendance records for all students
    const attendancePromises = students.map((student) => {
      return Attendance.create({
        student: student._id,
        session: session._id,
        status: "pending",
      })
    })

    await Promise.all(attendancePromises)

    // Create session object with populated fields for email
    const sessionForEmail = {
      ...session.toObject(),
      hospital: { name: hospital.name },
      faculty: { name: faculty.name },
    }

    // Send email notifications to students (non-blocking)
    emailService.sendSessionCreationEmail(students, sessionForEmail).catch((err) => {
      console.error("Failed to send session creation emails:", err)
    })

    res.status(201).json({
      success: true,
      data: {
        session,
        qrCode,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get active sessions for faculty
// @route   GET /api/attendance/sessions/active
// @access  Private/Faculty
exports.getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await AttendanceSession.find({
      faculty: req.user.id,
      active: true,
      expiresAt: { $gt: new Date() },
    }).populate("hospital", "name")

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get pending attendance for faculty
// @route   GET /api/attendance/pending
// @access  Private/Faculty
exports.getPendingAttendance = async (req, res, next) => {
  try {
    // Get all sessions created by this faculty
    const sessions = await AttendanceSession.find({
      faculty: req.user.id,
    }).populate("hospital", "name")

    // For each session, get all pending attendance records
    const pendingSessions = []

    for (const session of sessions) {
      const attendanceRecords = await Attendance.find({
        session: session._id,
      }).populate("student", "name studentId")

      // Format the data for frontend
      const students = attendanceRecords.map((record) => ({
        id: record.student._id,
        name: record.student.name,
        studentId: record.student.studentId,
        status: record.status,
      }))

      pendingSessions.push({
        id: session._id,
        date: session.date,
        hospital: session.hospital.name,
        department: session.department,
        students,
      })
    }

    res.status(200).json({
      success: true,
      count: pendingSessions.length,
      data: pendingSessions,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Verify student attendance
// @route   PUT /api/attendance/verify/:sessionId/:studentId
// @access  Private/Faculty
exports.verifyAttendance = async (req, res, next) => {
  try {
    const { status } = req.body

    if (!["present", "absent"].includes(status)) {
      return next(new ErrorResponse("Status must be either present or absent", 400))
    }

    // Find the attendance record
    const attendance = await Attendance.findOne({
      session: req.params.sessionId,
      student: req.params.studentId,
    })
      .populate({
        path: "session",
        populate: {
          path: "hospital",
          select: "name",
        },
      })
      .populate("student", "name email")

    if (!attendance) {
      return next(new ErrorResponse("Attendance record not found", 404))
    }

    // Update the attendance record
    attendance.status = status
    attendance.verifiedBy = req.user.id
    attendance.verifiedAt = Date.now()
    await attendance.save()

    // Send email notification (non-blocking)
    emailService.sendAttendanceVerificationEmail(attendance.student, attendance.session, status).catch((err) => {
      console.error("Failed to send attendance verification email:", err)
    })

    res.status(200).json({
      success: true,
      data: attendance,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Mark attendance (student)
// @route   POST /api/attendance/mark
// @access  Private/Student
exports.markAttendance = async (req, res, next) => {
  try {
    const { sessionId, qrData, location } = req.body

    let session
    let hospital

    // If QR data is provided, validate it
    if (qrData) {
      try {
        const parsedData = JSON.parse(qrData)
        session = await AttendanceSession.findById(parsedData.sessionId)

        if (session) {
          hospital = await Hospital.findById(session.hospital)
        }
      } catch (error) {
        return next(new ErrorResponse("Invalid QR code data", 400))
      }
    } else if (sessionId) {
      // If session ID is provided directly
      session = await AttendanceSession.findById(sessionId)

      if (session) {
        hospital = await Hospital.findById(session.hospital)
      }
    } else {
      return next(new ErrorResponse("Session ID or QR data is required", 400))
    }

    if (!session) {
      return next(new ErrorResponse("Attendance session not found", 404))
    }

    // Check if session is still active
    if (!session.active || session.expiresAt < new Date()) {
      return next(new ErrorResponse("Attendance session has expired", 400))
    }

    // Verify location if provided
    if (location && hospital?.location?.coordinates) {
      const { latitude, longitude } = location

      if (!latitude || !longitude) {
        return next(new ErrorResponse("Invalid location data", 400))
      }

      // Check if student is within the hospital radius
      const isWithinRadius = locationVerifier.isLocationWithinRange(
        [longitude, latitude],
        hospital.location.coordinates,
        hospital.location.radius,
      )

      if (!isWithinRadius) {
        return next(new ErrorResponse("You are not within the hospital premises. Location verification failed.", 400))
      }
    }

    // Find the attendance record
    let attendance = await Attendance.findOne({
      session: session._id,
      student: req.user.id,
    })

    if (!attendance) {
      // Create a new attendance record if one doesn't exist
      attendance = await Attendance.create({
        session: session._id,
        student: req.user.id,
        status: "pending",
        locationVerified: !!location, // Mark as location verified if location was provided
      })
    } else if (attendance.status !== "pending") {
      return next(new ErrorResponse("Attendance already marked", 400))
    }

    res.status(200).json({
      success: true,
      data: {
        message: "Attendance marked successfully and pending verification",
        attendance,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get student attendance
// @route   GET /api/attendance/student
// @access  Private/Student
exports.getStudentAttendance = async (req, res, next) => {
  try {
    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({
      student: req.user.id,
    })
      .populate({
        path: "session",
        populate: {
          path: "hospital",
          select: "name",
        },
      })
      .populate("verifiedBy", "name")

    // Format the data for frontend
    const formattedRecords = attendanceRecords.map((record) => ({
      id: record._id,
      date: record.session.date,
      hospital: record.session.hospital.name,
      department: record.session.department,
      status: record.status,
      verifiedBy: record.verifiedBy ? record.verifiedBy.name : undefined,
    }))

    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      data: formattedRecords,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    End attendance session
// @route   PUT /api/attendance/sessions/:id/end
// @access  Private/Faculty
exports.endAttendanceSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)

    if (!session) {
      return next(new ErrorResponse("Attendance session not found", 404))
    }

    // Check if the faculty is the owner of the session
    if (session.faculty.toString() !== req.user.id) {
      return next(new ErrorResponse("Not authorized to end this session", 401))
    }

    session.active = false
    await session.save()

    res.status(200).json({
      success: true,
      data: session,
    })
  } catch (err) {
    next(err)
  }
}

