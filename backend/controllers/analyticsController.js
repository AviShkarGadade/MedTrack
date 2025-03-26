const asyncHandler = require("../middleware/async")
const ErrorResponse = require("../utils/errorResponse")
const Attendance = require("../models/Attendance")
const Session = require("../models/Session")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const mongoose = require("mongoose")

// @desc    Get attendance analytics
// @route   GET /api/v1/analytics/attendance
// @access  Private (Admin, Faculty)
exports.getAttendanceAnalytics = asyncHandler(async (req, res, next) => {
  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Attendance by day
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
        verified: {
          $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Attendance by hour of day
  const attendanceByHour = await Attendance.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Attendance by hospital
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
        verified: {
          $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ])

  // Verification rate over time
  const verificationRateOverTime = await Attendance.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: 1 },
        verified: {
          $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 1,
        total: 1,
        verified: 1,
        verificationRate: {
          $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$verified", "$total"] }, 100] }],
        },
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
      attendanceByDay,
      attendanceByHour,
      attendanceByHospital,
      verificationRateOverTime,
    },
  })
})

// @desc    Get user analytics
// @route   GET /api/v1/analytics/users
// @access  Private (Admin, Faculty)
exports.getUserAnalytics = asyncHandler(async (req, res, next) => {
  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Users by role
  const usersByRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }])

  // New users over time
  const newUsersOverTime = await User.aggregate([
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

  // Most active students (by attendance count)
  const mostActiveStudents = await Attendance.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: "$userData" },
    {
      $match: {
        "userData.role": "student",
      },
    },
    {
      $group: {
        _id: "$userData._id",
        name: { $first: "$userData.name" },
        email: { $first: "$userData.email" },
        attendanceCount: { $sum: 1 },
        verifiedCount: {
          $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        attendanceCount: 1,
        verifiedCount: 1,
        verificationRate: {
          $cond: [
            { $eq: ["$attendanceCount", 0] },
            0,
            { $multiply: [{ $divide: ["$verifiedCount", "$attendanceCount"] }, 100] },
          ],
        },
      },
    },
    { $sort: { attendanceCount: -1 } },
    { $limit: 10 },
  ])

  // Most active faculty (by session count)
  const mostActiveFaculty = await Session.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "facultyData",
      },
    },
    { $unwind: "$facultyData" },
    {
      $group: {
        _id: "$facultyData._id",
        name: { $first: "$facultyData.name" },
        email: { $first: "$facultyData.email" },
        sessionCount: { $sum: 1 },
      },
    },
    { $sort: { sessionCount: -1 } },
    { $limit: 10 },
  ])

  res.status(200).json({
    success: true,
    data: {
      dateRange: {
        startDate,
        endDate,
      },
      usersByRole,
      newUsersOverTime,
      mostActiveStudents,
      mostActiveFaculty,
    },
  })
})

// @desc    Get hospital analytics
// @route   GET /api/v1/analytics/hospitals
// @access  Private (Admin, Faculty)
exports.getHospitalAnalytics = asyncHandler(async (req, res, next) => {
  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Sessions by hospital
  const sessionsByHospital = await Session.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital",
        foreignField: "_id",
        as: "hospitalData",
      },
    },
    { $unwind: "$hospitalData" },
    {
      $group: {
        _id: "$hospitalData._id",
        hospitalName: { $first: "$hospitalData.name" },
        sessionCount: { $sum: 1 },
      },
    },
    { $sort: { sessionCount: -1 } },
  ])

  // Attendance by hospital
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
        attendanceCount: { $sum: 1 },
        verifiedCount: {
          $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 1,
        hospitalName: 1,
        attendanceCount: 1,
        verifiedCount: 1,
        verificationRate: {
          $cond: [
            { $eq: ["$attendanceCount", 0] },
            0,
            { $multiply: [{ $divide: ["$verifiedCount", "$attendanceCount"] }, 100] },
          ],
        },
      },
    },
    { $sort: { attendanceCount: -1 } },
  ])

  // Unique students by hospital
  const uniqueStudentsByHospital = await Attendance.aggregate([
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
        _id: {
          hospital: "$hospitalData._id",
          user: "$user",
        },
        hospitalName: { $first: "$hospitalData.name" },
      },
    },
    {
      $group: {
        _id: "$_id.hospital",
        hospitalName: { $first: "$hospitalName" },
        uniqueStudentCount: { $sum: 1 },
      },
    },
    { $sort: { uniqueStudentCount: -1 } },
  ])

  res.status(200).json({
    success: true,
    data: {
      dateRange: {
        startDate,
        endDate,
      },
      sessionsByHospital,
      attendanceByHospital,
      uniqueStudentsByHospital,
    },
  })
})

// @desc    Get faculty analytics
// @route   GET /api/v1/analytics/faculty
// @access  Private (Admin, Faculty)
exports.getFacultyAnalytics = asyncHandler(async (req, res, next) => {
  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Sessions by faculty
  const sessionsByFaculty = await Session.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "facultyData",
      },
    },
    { $unwind: "$facultyData" },
    {
      $group: {
        _id: "$facultyData._id",
        name: { $first: "$facultyData.name" },
        email: { $first: "$facultyData.email" },
        sessionCount: { $sum: 1 },
      },
    },
    { $sort: { sessionCount: -1 } },
  ])

  // Attendance verification by faculty
  const verificationsByFaculty = await Attendance.aggregate([
    {
      $match: {
        verified: true,
        verificationTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "verifiedBy",
        foreignField: "_id",
        as: "facultyData",
      },
    },
    { $unwind: "$facultyData" },
    {
      $group: {
        _id: "$facultyData._id",
        name: { $first: "$facultyData.name" },
        email: { $first: "$facultyData.email" },
        verificationCount: { $sum: 1 },
      },
    },
    { $sort: { verificationCount: -1 } },
  ])

  // Faculty activity by hospital
  const facultyActivityByHospital = await Session.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "facultyData",
      },
    },
    { $unwind: "$facultyData" },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital",
        foreignField: "_id",
        as: "hospitalData",
      },
    },
    { $unwind: "$hospitalData" },
    {
      $group: {
        _id: {
          faculty: "$facultyData._id",
          hospital: "$hospitalData._id",
        },
        facultyName: { $first: "$facultyData.name" },
        hospitalName: { $first: "$hospitalData.name" },
        sessionCount: { $sum: 1 },
      },
    },
    {
      $sort: { sessionCount: -1 },
    },
  ])

  res.status(200).json({
    success: true,
    data: {
      dateRange: {
        startDate,
        endDate,
      },
      sessionsByFaculty,
      verificationsByFaculty,
      facultyActivityByHospital,
    },
  })
})

// @desc    Get dashboard stats
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin, Faculty)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  // Get date range from query params or use default (last 30 days)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Total counts
  const totalUsers = await User.countDocuments()
  const totalStudents = await User.countDocuments({ role: "student" })
  const totalFaculty = await User.countDocuments({ role: "faculty" })
  const totalHospitals = await Hospital.countDocuments()

  // Recent activity
  const recentSessions = await Session.find({
    startTime: { $gte: startDate, $lte: endDate },
  })
    .populate("faculty", "name")
    .populate("hospital", "name")
    .sort({ startTime: -1 })
    .limit(5)

  const recentAttendance = await Attendance.find({
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate("user", "name")
    .populate({
      path: "session",
      select: "title",
      populate: {
        path: "hospital",
        select: "name",
      },
    })
    .sort({ createdAt: -1 })
    .limit(5)

  // Activity summary
  const sessionCount = await Session.countDocuments({
    startTime: { $gte: startDate, $lte: endDate },
  })

  const attendanceCount = await Attendance.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  })

  const verifiedAttendanceCount = await Attendance.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    verified: true,
  })

  const verificationRate = attendanceCount > 0 ? (verifiedAttendanceCount / attendanceCount) * 100 : 0

  // Attendance trend (last 7 days)
  const sevenDaysAgo = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

  const attendanceTrend = await Attendance.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo, $lte: endDate },
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
      counts: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalHospitals,
        sessionCount,
        attendanceCount,
        verifiedAttendanceCount,
        verificationRate: verificationRate.toFixed(2),
      },
      recentActivity: {
        sessions: recentSessions,
        attendance: recentAttendance,
      },
      attendanceTrend,
    },
  })
})

