const asyncHandler = require("../middleware/async")
const ErrorResponse = require("../utils/errorResponse")
const Attendance = require("../models/Attendance")
const Session = require("../models/Session")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const path = require("path")
const fs = require("fs")
const { createObjectCsvWriter } = require("csv-writer")
const PDFDocument = require("pdfkit")

// @desc    Get attendance report for a specific user
// @route   GET /api/v1/reports/user/:userId
// @access  Private (Admin, Faculty, or the User themselves)
exports.getUserAttendanceReport = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId

  // Check if user exists
  const user = await User.findById(userId)
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404))
  }

  // Check if the requesting user has permission to view this report
  if (req.user.role !== "admin" && req.user.role !== "faculty" && req.user.id !== userId) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this report`, 403))
  }

  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Find all attendance records for this user within the date range
  const attendanceRecords = await Attendance.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate({
      path: "session",
      select: "title startTime endTime",
      populate: {
        path: "hospital",
        select: "name location",
      },
    })
    .sort({ createdAt: -1 })

  // Calculate statistics
  const totalSessions = attendanceRecords.length
  const verifiedSessions = attendanceRecords.filter((record) => record.verified).length
  const verificationRate = totalSessions > 0 ? (verifiedSessions / totalSessions) * 100 : 0

  // Group by hospital
  const hospitalAttendance = {}
  attendanceRecords.forEach((record) => {
    if (record.session && record.session.hospital) {
      const hospitalName = record.session.hospital.name
      if (!hospitalAttendance[hospitalName]) {
        hospitalAttendance[hospitalName] = 0
      }
      hospitalAttendance[hospitalName]++
    }
  })

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      dateRange: {
        startDate,
        endDate,
      },
      statistics: {
        totalSessions,
        verifiedSessions,
        verificationRate: verificationRate.toFixed(2),
      },
      hospitalAttendance,
      attendanceRecords,
    },
  })
})

// @desc    Get attendance report for a specific session
// @route   GET /api/v1/reports/session/:sessionId
// @access  Private (Admin, Faculty who created the session)
exports.getSessionAttendanceReport = asyncHandler(async (req, res, next) => {
  const sessionId = req.params.sessionId

  // Check if session exists
  const session = await Session.findById(sessionId).populate("faculty hospital")
  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${sessionId}`, 404))
  }

  // Check if the requesting user has permission to view this report
  if (req.user.role !== "admin" && session.faculty._id.toString() !== req.user.id) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this report`, 403))
  }

  // Find all attendance records for this session
  const attendanceRecords = await Attendance.find({
    session: sessionId,
  })
    .populate({
      path: "user",
      select: "name email",
    })
    .sort({ createdAt: 1 })

  // Calculate statistics
  const totalAttendees = attendanceRecords.length
  const verifiedAttendees = attendanceRecords.filter((record) => record.verified).length
  const verificationRate = totalAttendees > 0 ? (verifiedAttendees / totalAttendees) * 100 : 0

  res.status(200).json({
    success: true,
    data: {
      session: {
        id: session._id,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        faculty: {
          id: session.faculty._id,
          name: session.faculty.name,
          email: session.faculty.email,
        },
        hospital: {
          id: session.hospital._id,
          name: session.hospital.name,
          location: session.hospital.location,
        },
      },
      statistics: {
        totalAttendees,
        verifiedAttendees,
        verificationRate: verificationRate.toFixed(2),
      },
      attendanceRecords,
    },
  })
})

// @desc    Get hospital attendance report
// @route   GET /api/v1/reports/hospital/:hospitalId
// @access  Private (Admin, Faculty)
exports.getHospitalAttendanceReport = asyncHandler(async (req, res, next) => {
  const hospitalId = req.params.hospitalId

  // Check if hospital exists
  const hospital = await Hospital.findById(hospitalId)
  if (!hospital) {
    return next(new ErrorResponse(`Hospital not found with id of ${hospitalId}`, 404))
  }

  // Check if the requesting user has permission to view this report
  if (req.user.role !== "admin" && req.user.role !== "faculty") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this report`, 403))
  }

  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Find all sessions for this hospital within the date range
  const sessions = await Session.find({
    hospital: hospitalId,
    startTime: { $gte: startDate, $lte: endDate },
  }).populate("faculty")

  // Get all attendance records for these sessions
  const sessionIds = sessions.map((session) => session._id)
  const attendanceRecords = await Attendance.find({
    session: { $in: sessionIds },
  })
    .populate({
      path: "user",
      select: "name email",
    })
    .populate({
      path: "session",
      select: "title startTime endTime faculty",
      populate: {
        path: "faculty",
        select: "name email",
      },
    })

  // Calculate statistics
  const totalSessions = sessions.length
  const totalAttendees = attendanceRecords.length
  const uniqueAttendees = [...new Set(attendanceRecords.map((record) => record.user._id.toString()))].length
  const verifiedAttendances = attendanceRecords.filter((record) => record.verified).length
  const verificationRate = totalAttendees > 0 ? (verifiedAttendances / totalAttendees) * 100 : 0

  // Group by faculty
  const facultySessionCount = {}
  sessions.forEach((session) => {
    if (session.faculty) {
      const facultyName = session.faculty.name
      if (!facultySessionCount[facultyName]) {
        facultySessionCount[facultyName] = 0
      }
      facultySessionCount[facultyName]++
    }
  })

  res.status(200).json({
    success: true,
    data: {
      hospital: {
        id: hospital._id,
        name: hospital.name,
        location: hospital.location,
      },
      dateRange: {
        startDate,
        endDate,
      },
      statistics: {
        totalSessions,
        totalAttendees,
        uniqueAttendees,
        verifiedAttendances,
        verificationRate: verificationRate.toFixed(2),
      },
      facultySessionCount,
      sessions,
      attendanceRecords,
    },
  })
})

// @desc    Export user attendance report as CSV
// @route   GET /api/v1/reports/user/:userId/export/csv
// @access  Private (Admin, Faculty, or the User themselves)
exports.exportUserAttendanceReportCSV = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId

  // Check if user exists
  const user = await User.findById(userId)
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404))
  }

  // Check if the requesting user has permission to view this report
  if (req.user.role !== "admin" && req.user.role !== "faculty" && req.user.id !== userId) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this report`, 403))
  }

  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Find all attendance records for this user within the date range
  const attendanceRecords = await Attendance.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate({
      path: "session",
      select: "title startTime endTime",
      populate: {
        path: "hospital",
        select: "name location",
      },
    })
    .sort({ createdAt: -1 })

  // Create a temporary file path
  const tempDir = path.join(__dirname, "../temp")
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }

  const fileName = `user_attendance_${userId}_${Date.now()}.csv`
  const filePath = path.join(tempDir, fileName)

  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "date", title: "Date" },
      { id: "sessionTitle", title: "Session Title" },
      { id: "hospital", title: "Hospital" },
      { id: "checkInTime", title: "Check-in Time" },
      { id: "verified", title: "Verified" },
      { id: "verifiedBy", title: "Verified By" },
      { id: "verificationTime", title: "Verification Time" },
    ],
  })

  // Format data for CSV
  const records = attendanceRecords.map((record) => {
    return {
      date: record.createdAt.toISOString().split("T")[0],
      sessionTitle: record.session ? record.session.title : "N/A",
      hospital: record.session && record.session.hospital ? record.session.hospital.name : "N/A",
      checkInTime: record.createdAt.toISOString(),
      verified: record.verified ? "Yes" : "No",
      verifiedBy: record.verifiedBy ? record.verifiedBy : "N/A",
      verificationTime: record.verificationTime ? record.verificationTime.toISOString() : "N/A",
    }
  })

  // Write to CSV
  await csvWriter.writeRecords(records)

  // Send file to client
  res.download(filePath, fileName, (err) => {
    if (err) {
      return next(new ErrorResponse("Error downloading file", 500))
    }

    // Delete the file after sending
    fs.unlinkSync(filePath)
  })
})

// @desc    Export user attendance report as PDF
// @route   GET /api/v1/reports/user/:userId/export/pdf
// @access  Private (Admin, Faculty, or the User themselves)
exports.exportUserAttendanceReportPDF = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId

  // Check if user exists
  const user = await User.findById(userId)
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404))
  }

  // Check if the requesting user has permission to view this report
  if (req.user.role !== "admin" && req.user.role !== "faculty" && req.user.id !== userId) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this report`, 403))
  }

  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Find all attendance records for this user within the date range
  const attendanceRecords = await Attendance.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate({
      path: "session",
      select: "title startTime endTime",
      populate: {
        path: "hospital",
        select: "name location",
      },
    })
    .sort({ createdAt: -1 })

  // Calculate statistics
  const totalSessions = attendanceRecords.length
  const verifiedSessions = attendanceRecords.filter((record) => record.verified).length
  const verificationRate = totalSessions > 0 ? (verifiedSessions / totalSessions) * 100 : 0

  // Create a temporary file path
  const tempDir = path.join(__dirname, "../temp")
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }

  const fileName = `user_attendance_${userId}_${Date.now()}.pdf`
  const filePath = path.join(tempDir, fileName)

  // Create PDF document
  const doc = new PDFDocument()
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)

  // Add content to PDF
  doc.fontSize(20).text("Attendance Report", { align: "center" })
  doc.moveDown()
  doc.fontSize(14).text(`User: ${user.name} (${user.email})`)
  doc
    .fontSize(12)
    .text(`Report Period: ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`)
  doc.moveDown()

  // Add statistics
  doc.fontSize(14).text("Statistics")
  doc.fontSize(12).text(`Total Sessions: ${totalSessions}`)
  doc.fontSize(12).text(`Verified Sessions: ${verifiedSessions}`)
  doc.fontSize(12).text(`Verification Rate: ${verificationRate.toFixed(2)}%`)
  doc.moveDown()

  // Add attendance records
  doc.fontSize(14).text("Attendance Records")
  doc.moveDown()

  // Table header
  const tableTop = doc.y
  const tableLeft = 50
  const colWidth = 100

  doc.fontSize(10).text("Date", tableLeft, tableTop)
  doc.text("Session", tableLeft + colWidth, tableTop)
  doc.text("Hospital", tableLeft + colWidth * 2, tableTop)
  doc.text("Verified", tableLeft + colWidth * 3, tableTop)

  doc
    .moveTo(tableLeft, tableTop + 15)
    .lineTo(tableLeft + colWidth * 4, tableTop + 15)
    .stroke()

  let rowTop = tableTop + 20

  // Table rows
  attendanceRecords.forEach((record, index) => {
    // Add a new page if we're near the bottom
    if (rowTop > doc.page.height - 50) {
      doc.addPage()
      rowTop = 50
    }

    const date = record.createdAt.toISOString().split("T")[0]
    const session = record.session ? record.session.title : "N/A"
    const hospital = record.session && record.session.hospital ? record.session.hospital.name : "N/A"
    const verified = record.verified ? "Yes" : "No"

    doc.fontSize(10).text(date, tableLeft, rowTop)
    doc.text(session, tableLeft + colWidth, rowTop, { width: colWidth, ellipsis: true })
    doc.text(hospital, tableLeft + colWidth * 2, rowTop, { width: colWidth, ellipsis: true })
    doc.text(verified, tableLeft + colWidth * 3, rowTop)

    rowTop += 20
  })

  // Finalize PDF
  doc.end()

  // Wait for the PDF to be created
  stream.on("finish", () => {
    // Send file to client
    res.download(filePath, fileName, (err) => {
      if (err) {
        return next(new ErrorResponse("Error downloading file", 500))
      }

      // Delete the file after sending
      fs.unlinkSync(filePath)
    })
  })
})

// @desc    Get overall attendance statistics
// @route   GET /api/v1/reports/statistics
// @access  Private (Admin, Faculty)
exports.getOverallStatistics = asyncHandler(async (req, res, next) => {
  // Check if the requesting user has permission
  if (req.user.role !== "admin" && req.user.role !== "faculty") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this report`, 403))
  }

  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Count total users by role
  const userCounts = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])

  const userCountsByRole = {}
  userCounts.forEach((item) => {
    userCountsByRole[item._id] = item.count
  })

  // Count total hospitals
  const hospitalCount = await Hospital.countDocuments()

  // Count sessions in the date range
  const sessionCount = await Session.countDocuments({
    startTime: { $gte: startDate, $lte: endDate },
  })

  // Count attendance records in the date range
  const attendanceCount = await Attendance.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  })

  // Count verified attendance records
  const verifiedAttendanceCount = await Attendance.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    verified: true,
  })

  // Calculate verification rate
  const verificationRate = attendanceCount > 0 ? (verifiedAttendanceCount / attendanceCount) * 100 : 0

  // Get attendance by hospital
  const attendanceByHospital = await Attendance.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "sessions",
        localField: "session",
        foreignField: "_id",
        as: "sessionData",
      },
    },
    { $unwind: "$sessionData" },
    {
      $lookup: {
        from: "hospitals",
        localField: "sessionData.hospital",
        foreignField: "_id",
        as: "hospitalData",
      },
    },
    { $unwind: "$hospitalData" },
    {
      $group: {
        _id: "$hospitalData._id",
        hospitalName: { $first: "$hospitalData.name" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ])

  // Get attendance by day
  const attendanceByDay = await Attendance.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  res.status(200).json({
    success: true,
    data: {
      dateRange: {
        startDate,
        endDate,
      },
      userStatistics: {
        total: Object.values(userCountsByRole).reduce((a, b) => a + b, 0),
        byRole: userCountsByRole,
      },
      hospitalCount,
      sessionStatistics: {
        total: sessionCount,
      },
      attendanceStatistics: {
        total: attendanceCount,
        verified: verifiedAttendanceCount,
        verificationRate: verificationRate.toFixed(2),
      },
      attendanceByHospital,
      attendanceByDay,
    },
  })
})

