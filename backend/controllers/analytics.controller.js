const Attendance = require("../models/Attendance")
const AttendanceSession = require("../models/AttendanceSession")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const moment = require("moment")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private/Admin
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    // Count users by role
    const totalStudents = await User.countDocuments({ role: "student" })
    const totalFaculty = await User.countDocuments({ role: "faculty" })
    const totalHospitals = await Hospital.countDocuments()

    // Count recent sessions
    const recentSessions = await AttendanceSession.countDocuments({
      date: { $gte: moment().subtract(30, "days").toDate() },
    })

    // Calculate attendance rates
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const attendanceCounts = attendanceStats.reduce(
      (acc, stat) => {
        acc[stat._id] = stat.count
        return acc
      },
      { present: 0, absent: 0, pending: 0 },
    )

    const totalAttendance = Object.values(attendanceCounts).reduce((sum, count) => sum + count, 0)
    const attendanceRate = totalAttendance > 0 ? (attendanceCounts.present / totalAttendance) * 100 : 0

    // Get active sessions
    const activeSessions = await AttendanceSession.countDocuments({
      active: true,
      expiresAt: { $gt: new Date() },
    })

    // New users this month
    const newUsers = await User.countDocuments({
      createdAt: { $gte: moment().startOf("month").toDate() },
    })

    // Return analytics data
    res.status(200).json({
      success: true,
      data: {
        users: {
          totalStudents,
          totalFaculty,
          totalAdmins: await User.countDocuments({ role: "admin" }),
          newThisMonth: newUsers,
        },
        hospitals: {
          total: totalHospitals,
          departments: await getTotalDepartments(),
        },
        attendance: {
          total: totalAttendance,
          present: attendanceCounts.present,
          absent: attendanceCounts.absent,
          pending: attendanceCounts.pending,
          rate: attendanceRate,
        },
        sessions: {
          total: await AttendanceSession.countDocuments(),
          active: activeSessions,
          recent: recentSessions,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get attendance trends
// @route   GET /api/analytics/attendance-trends
// @access  Private/Admin, Faculty
exports.getAttendanceTrends = async (req, res, next) => {
  try {
    const { period = "daily", startDate, endDate } = req.query

    // Determine date format and group by format based on period
    let dateFormat, groupByFormat

    switch (period) {
      case "weekly":
        dateFormat = "%Y-%U" // Year-Week
        groupByFormat = { year: "$_id.year", week: "$_id.week" }
        break
      case "monthly":
        dateFormat = "%Y-%m" // Year-Month
        groupByFormat = { year: "$_id.year", month: "$_id.month" }
        break
      case "yearly":
        dateFormat = "%Y" // Year
        groupByFormat = { year: "$_id.year" }
        break
      case "daily":
      default:
        dateFormat = "%Y-%m-%d" // Year-Month-Day
        groupByFormat = { year: "$_id.year", month: "$_id.month", day: "$_id.day" }
        break
    }

    // Build date range query
    const dateQuery = {}
    if (startDate) {
      dateQuery.createdAt = { $gte: new Date(startDate) }
    }
    if (endDate) {
      if (dateQuery.createdAt) {
        dateQuery.createdAt.$lte = new Date(endDate)
      } else {
        dateQuery.createdAt = { $lte: new Date(endDate) }
      }
    }

    // Get attendance trends
    const attendanceTrends = await Attendance.aggregate([
      {
        $match: dateQuery,
      },
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "sessionData",
        },
      },
      {
        $unwind: "$sessionData",
      },
      {
        $project: {
          status: 1,
          date: "$sessionData.date",
          year: { $year: "$sessionData.date" },
          month: { $month: "$sessionData.date" },
          day: { $dayOfMonth: "$sessionData.date" },
          week: { $week: "$sessionData.date" },
        },
      },
      {
        $group: {
          _id: getGroupByObject(period),
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          ...groupByFormat,
          total: 1,
          present: 1,
          absent: 1,
          pending: 1,
          presentRate: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }],
          },
        },
      },
      {
        $sort: { year: 1, month: 1, week: 1, day: 1 },
      },
    ])

    // Format the results for the frontend
    const formattedTrends = attendanceTrends.map((trend) => {
      let label

      switch (period) {
        case "weekly":
          label = `Week ${trend.week}, ${trend.year}`
          break
        case "monthly":
          label = moment(`${trend.year}-${trend.month}`, "YYYY-M").format("MMMM YYYY")
          break
        case "yearly":
          label = trend.year.toString()
          break
        case "daily":
        default:
          label = moment(`${trend.year}-${trend.month}-${trend.day}`, "YYYY-M-D").format("MMM D, YYYY")
          break
      }

      return {
        label,
        total: trend.total,
        present: trend.present,
        absent: trend.absent,
        pending: trend.pending,
        presentRate: Number.parseFloat(trend.presentRate.toFixed(2)),
      }
    })

    res.status(200).json({
      success: true,
      data: formattedTrends,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get hospital analytics
// @route   GET /api/analytics/hospitals
// @access  Private/Admin
exports.getHospitalAnalytics = async (req, res, next) => {
  try {
    // Get attendance statistics by hospital
    const hospitalStats = await Attendance.aggregate([
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "sessionData",
        },
      },
      {
        $unwind: "$sessionData",
      },
      {
        $lookup: {
          from: "hospitals",
          localField: "sessionData.hospital",
          foreignField: "_id",
          as: "hospitalData",
        },
      },
      {
        $unwind: "$hospitalData",
      },
      {
        $group: {
          _id: {
            hospital: "$hospitalData._id",
            hospitalName: "$hospitalData.name",
            department: "$sessionData.department",
          },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          hospitalId: "$_id.hospital",
          hospitalName: "$_id.hospitalName",
          department: "$_id.department",
          total: 1,
          present: 1,
          absent: 1,
          pending: 1,
          presentRate: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }],
          },
        },
      },
      {
        $sort: { hospitalName: 1, department: 1 },
      },
    ])

    // Group by hospital
    const hospitalAnalytics = {}

    hospitalStats.forEach((stat) => {
      if (!hospitalAnalytics[stat.hospitalId]) {
        hospitalAnalytics[stat.hospitalId] = {
          id: stat.hospitalId,
          name: stat.hospitalName,
          departments: [],
          total: 0,
          present: 0,
          absent: 0,
          pending: 0,
        }
      }

      hospitalAnalytics[stat.hospitalId].departments.push({
        name: stat.department,
        total: stat.total,
        present: stat.present,
        absent: stat.absent,
        pending: stat.pending,
        presentRate: Number.parseFloat(stat.presentRate.toFixed(2)),
      })

      hospitalAnalytics[stat.hospitalId].total += stat.total
      hospitalAnalytics[stat.hospitalId].present += stat.present
      hospitalAnalytics[stat.hospitalId].absent += stat.absent
      hospitalAnalytics[stat.hospitalId].pending += stat.pending
    })

    // Calculate overall present rate for each hospital
    Object.values(hospitalAnalytics).forEach((hospital) => {
      hospital.presentRate =
        hospital.total > 0 ? Number.parseFloat(((hospital.present / hospital.total) * 100).toFixed(2)) : 0
    })

    res.status(200).json({
      success: true,
      data: Object.values(hospitalAnalytics),
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get student performance analytics
// @route   GET /api/analytics/student-performance
// @access  Private/Admin, Faculty
exports.getStudentPerformance = async (req, res, next) => {
  try {
    const { batch, limit = 10, sort = "desc" } = req.query

    // Build student query
    const studentQuery = { role: "student" }
    if (batch) {
      studentQuery.batch = batch
    }

    // Get all students
    const students = await User.find(studentQuery)

    // Calculate attendance statistics for each student
    const studentPerformance = []

    for (const student of students) {
      const attendanceRecords = await Attendance.find({ student: student._id })

      const totalSessions = attendanceRecords.length
      const presentCount = attendanceRecords.filter((a) => a.status === "present").length
      const absentCount = attendanceRecords.filter((a) => a.status === "absent").length
      const pendingCount = attendanceRecords.filter((a) => a.status === "pending").length
      const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0

      studentPerformance.push({
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        batch: student.batch,
        totalSessions,
        presentCount,
        absentCount,
        pendingCount,
        attendancePercentage: Number.parseFloat(attendancePercentage.toFixed(2)),
      })
    }

    // Sort by attendance percentage
    studentPerformance.sort((a, b) => {
      if (sort === "asc") {
        return a.attendancePercentage - b.attendancePercentage
      } else {
        return b.attendancePercentage - a.attendancePercentage
      }
    })

    // Limit the results if specified
    const limitedResults = limit > 0 ? studentPerformance.slice(0, Number.parseInt(limit)) : studentPerformance

    res.status(200).json({
      success: true,
      count: limitedResults.length,
      data: limitedResults,
    })
  } catch (err) {
    next(err)
  }
}

// Helper functions
function getGroupByObject(period) {
  switch (period) {
    case "weekly":
      return { year: "$year", week: "$week" }
    case "monthly":
      return { year: "$year", month: "$month" }
    case "yearly":
      return { year: "$year" }
    case "daily":
    default:
      return { year: "$year", month: "$month", day: "$day" }
  }
}

async function getTotalDepartments() {
  const hospitals = await Hospital.find()
  const departmentSet = new Set()

  hospitals.forEach((hospital) => {
    hospital.departments.forEach((department) => {
      departmentSet.add(department)
    })
  })

  return departmentSet.size
}

