const Attendance = require("../models/Attendance")
const AttendanceSession = require("../models/AttendanceSession")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const ErrorResponse = require("../utils/errorResponse")
const reportGenerator = require("../utils/reportGenerator")
const path = require("path")
const fs = require("fs")
const moment = require("moment")

// @desc    Generate student attendance report
// @route   GET /api/reports/student/:studentId
// @access  Private/Admin, Faculty, Self
exports.generateStudentReport = async (req, res, next) => {
  try {
    const studentId = req.params.studentId
    const { format = "json", startDate, endDate } = req.query

    // Check if user has permission to access this report
    if (req.user.role === "student" && req.user.id !== studentId) {
      return next(new ErrorResponse("Not authorized to access this report", 403))
    }

    // Find the student
    const student = await User.findById(studentId)
    if (!student || student.role !== "student") {
      return next(new ErrorResponse("Student not found", 404))
    }

    // Build date query
    const dateQuery = {}
    if (startDate) {
      dateQuery.date = { $gte: new Date(startDate) }
    }
    if (endDate) {
      if (dateQuery.date) {
        dateQuery.date.$lte = new Date(endDate)
      } else {
        dateQuery.date = { $lte: new Date(endDate) }
      }
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: studentId,
      ...dateQuery,
    })
      .populate({
        path: "session",
        select: "date hospital department",
        populate: {
          path: "hospital",
          select: "name",
        },
      })
      .populate("verifiedBy", "name")

    // Format data for response
    const formattedRecords = attendanceRecords.map((record) => ({
      id: record._id,
      date: record.session.date,
      hospital: record.session.hospital.name,
      department: record.session.department,
      status: record.status,
      verifiedBy: record.verifiedBy ? record.verifiedBy.name : undefined,
      verifiedAt: record.verifiedAt,
    }))

    // Calculate statistics
    const totalSessions = formattedRecords.length
    const presentCount = formattedRecords.filter((r) => r.status === "present").length
    const absentCount = formattedRecords.filter((r) => r.status === "absent").length
    const pendingCount = formattedRecords.filter((r) => r.status === "pending").length
    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0

    // Prepare summary data
    const summaryData = {
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        batch: student.batch,
      },
      stats: {
        totalSessions,
        presentCount,
        absentCount,
        pendingCount,
        attendancePercentage,
      },
      period: {
        startDate: startDate ? new Date(startDate).toISOString() : "All time",
        endDate: endDate ? new Date(endDate).toISOString() : "All time",
      },
    }

    // Generate report based on requested format
    if (format === "json") {
      return res.status(200).json({
        success: true,
        data: {
          summary: summaryData,
          records: formattedRecords,
        },
      })
    } else if (format === "csv" || format === "pdf") {
      const fileName = `student_attendance_${student.studentId}_${moment().format("YYYYMMDD")}`

      let filePath
      if (format === "csv") {
        filePath = await reportGenerator.generateCsvReport(formattedRecords, {
          reportType: "studentAttendance",
          fileName,
        })
      } else {
        filePath = await reportGenerator.generatePdfReport(formattedRecords, {
          reportType: "studentAttendance",
          fileName,
          title: "Student Attendance Report",
          subtitle: `${student.name} (${student.studentId}) - ${summaryData.period.startDate} to ${summaryData.period.endDate}`,
        })
      }

      // Send file
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          console.error("Error sending report file:", err)
        }

        // Delete file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting report file:", unlinkErr)
          }
        })
      })
    } else {
      return next(new ErrorResponse("Invalid report format. Supported formats: json, csv, pdf", 400))
    }
  } catch (err) {
    next(err)
  }
}

// @desc    Generate faculty sessions report
// @route   GET /api/reports/faculty/:facultyId
// @access  Private/Admin, Self
exports.generateFacultyReport = async (req, res, next) => {
  try {
    const facultyId = req.params.facultyId
    const { format = "json", startDate, endDate } = req.query

    // Check if user has permission to access this report
    if (req.user.role === "faculty" && req.user.id !== facultyId) {
      return next(new ErrorResponse("Not authorized to access this report", 403))
    }

    // Find the faculty
    const faculty = await User.findById(facultyId)
    if (!faculty || faculty.role !== "faculty") {
      return next(new ErrorResponse("Faculty not found", 404))
    }

    // Build date query
    const dateQuery = {}
    if (startDate) {
      dateQuery.date = { $gte: new Date(startDate) }
    }
    if (endDate) {
      if (dateQuery.date) {
        dateQuery.date.$lte = new Date(endDate)
      } else {
        dateQuery.date = { $lte: new Date(endDate) }
      }
    }

    // Get sessions created by this faculty
    const sessions = await AttendanceSession.find({
      faculty: facultyId,
      ...dateQuery,
    }).populate("hospital", "name")

    // Get attendance data for each session
    const sessionsWithAttendance = []

    for (const session of sessions) {
      const attendanceRecords = await Attendance.find({ session: session._id })

      const totalStudents = attendanceRecords.length
      const presentCount = attendanceRecords.filter((a) => a.status === "present").length
      const absentCount = attendanceRecords.filter((a) => a.status === "absent").length
      const pendingCount = attendanceRecords.filter((a) => a.status === "pending").length

      sessionsWithAttendance.push({
        id: session._id,
        date: session.date,
        hospital: session.hospital.name,
        department: session.department,
        totalStudents,
        presentCount,
        absentCount,
        pendingCount,
        active: session.active,
        expiresAt: session.expiresAt,
      })
    }

    // Calculate statistics
    const totalSessions = sessionsWithAttendance.length
    const totalStudents = sessionsWithAttendance.reduce((sum, s) => sum + s.totalStudents, 0)
    const totalPresent = sessionsWithAttendance.reduce((sum, s) => sum + s.presentCount, 0)
    const totalAbsent = sessionsWithAttendance.reduce((sum, s) => sum + s.absentCount, 0)
    const totalPending = sessionsWithAttendance.reduce((sum, s) => sum + s.pendingCount, 0)

    // Prepare summary data
    const summaryData = {
      faculty: {
        id: faculty._id,
        name: faculty.name,
        facultyId: faculty.facultyId,
        email: faculty.email,
        department: faculty.department,
      },
      stats: {
        totalSessions,
        totalStudents,
        totalPresent,
        totalAbsent,
        totalPending,
        verificationRate: totalStudents > 0 ? ((totalPresent + totalAbsent) / totalStudents) * 100 : 0,
      },
      period: {
        startDate: startDate ? new Date(startDate).toISOString() : "All time",
        endDate: endDate ? new Date(endDate).toISOString() : "All time",
      },
    }

    // Generate report based on requested format
    if (format === "json") {
      return res.status(200).json({
        success: true,
        data: {
          summary: summaryData,
          sessions: sessionsWithAttendance,
        },
      })
    } else if (format === "csv" || format === "pdf") {
      const fileName = `faculty_sessions_${faculty.facultyId}_${moment().format("YYYYMMDD")}`

      let filePath
      if (format === "csv") {
        filePath = await reportGenerator.generateCsvReport(sessionsWithAttendance, {
          reportType: "facultyAttendance",
          fileName,
        })
      } else {
        filePath = await reportGenerator.generatePdfReport(sessionsWithAttendance, {
          reportType: "facultyAttendance",
          fileName,
          title: "Faculty Sessions Report",
          subtitle: `${faculty.name} (${faculty.facultyId}) - ${summaryData.period.startDate} to ${summaryData.period.endDate}`,
        })
      }

      // Send file
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          console.error("Error sending report file:", err)
        }

        // Delete file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting report file:", unlinkErr)
          }
        })
      })
    } else {
      return next(new ErrorResponse("Invalid report format. Supported formats: json, csv, pdf", 400))
    }
  } catch (err) {
    next(err)
  }
}

// @desc    Generate hospital attendance report
// @route   GET /api/reports/hospital/:hospitalId
// @access  Private/Admin
exports.generateHospitalReport = async (req, res, next) => {
  try {
    const hospitalId = req.params.hospitalId
    const { format = "json", startDate, endDate } = req.query

    // Find the hospital
    const hospital = await Hospital.findById(hospitalId)
    if (!hospital) {
      return next(new ErrorResponse("Hospital not found", 404))
    }

    // Build date query
    const dateQuery = {}
    if (startDate) {
      dateQuery.date = { $gte: new Date(startDate) }
    }
    if (endDate) {
      if (dateQuery.date) {
        dateQuery.date.$lte = new Date(endDate)
      } else {
        dateQuery.date = { $lte: new Date(endDate) }
      }
    }

    // Get sessions for this hospital
    const sessions = await AttendanceSession.find({
      hospital: hospitalId,
      ...dateQuery,
    })

    // Group sessions by department
    const departmentStats = {}

    for (const session of sessions) {
      if (!departmentStats[session.department]) {
        departmentStats[session.department] = {
          sessionCount: 0,
          attendanceCount: 0,
          presentCount: 0,
          absentCount: 0,
          pendingCount: 0,
        }
      }

      const attendanceRecords = await Attendance.find({ session: session._id })

      departmentStats[session.department].sessionCount += 1
      departmentStats[session.department].attendanceCount += attendanceRecords.length
      departmentStats[session.department].presentCount += attendanceRecords.filter((a) => a.status === "present").length
      departmentStats[session.department].absentCount += attendanceRecords.filter((a) => a.status === "absent").length
      departmentStats[session.department].pendingCount += attendanceRecords.filter((a) => a.status === "pending").length
    }

    // Format data for report
    const hospitalReport = Object.entries(departmentStats).map(([department, stats]) => ({
      hospital: hospital.name,
      department,
      sessionCount: stats.sessionCount,
      attendanceCount: stats.attendanceCount,
      presentCount: stats.presentCount,
      absentCount: stats.absentCount,
      pendingCount: stats.pendingCount,
      presentPercent: stats.attendanceCount > 0 ? (stats.presentCount / stats.attendanceCount) * 100 : 0,
    }))

    // Calculate overall statistics
    const totalSessions = sessions.length
    const totalAttendance = Object.values(departmentStats).reduce((sum, stats) => sum + stats.attendanceCount, 0)
    const totalPresent = Object.values(departmentStats).reduce((sum, stats) => sum + stats.presentCount, 0)
    const totalAbsent = Object.values(departmentStats).reduce((sum, stats) => sum + stats.absentCount, 0)
    const totalPending = Object.values(departmentStats).reduce((sum, stats) => sum + stats.pendingCount, 0)

    // Prepare summary data
    const summaryData = {
      hospital: {
        id: hospital._id,
        name: hospital.name,
        departments: hospital.departments,
      },
      stats: {
        totalSessions,
        totalAttendance,
        totalPresent,
        totalAbsent,
        totalPending,
        attendanceRate: totalAttendance > 0 ? (totalPresent / totalAttendance) * 100 : 0,
      },
      period: {
        startDate: startDate ? new Date(startDate).toISOString() : "All time",
        endDate: endDate ? new Date(endDate).toISOString() : "All time",
      },
    }

    // Generate report based on requested format
    if (format === "json") {
      return res.status(200).json({
        success: true,
        data: {
          summary: summaryData,
          departments: hospitalReport,
        },
      })
    } else if (format === "csv" || format === "pdf") {
      const fileName = `hospital_report_${hospital.name.replace(/\s+/g, "_")}_${moment().format("YYYYMMDD")}`

      let filePath
      if (format === "csv") {
        filePath = await reportGenerator.generateCsvReport(hospitalReport, {
          reportType: "hospitalReport",
          fileName,
        })
      } else {
        filePath = await reportGenerator.generatePdfReport(hospitalReport, {
          reportType: "hospitalReport",
          fileName,
          title: "Hospital Attendance Report",
          subtitle: `${hospital.name} - ${summaryData.period.startDate} to ${summaryData.period.endDate}`,
        })
      }

      // Send file
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          console.error("Error sending report file:", err)
        }

        // Delete file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting report file:", unlinkErr)
          }
        })
      })
    } else {
      return next(new ErrorResponse("Invalid report format. Supported formats: json, csv, pdf", 400))
    }
  } catch (err) {
    next(err)
  }
}

// @desc    Generate summary report for all students
// @route   GET /api/reports/students-summary
// @access  Private/Admin, Faculty
exports.generateStudentsSummaryReport = async (req, res, next) => {
  try {
    const { format = "json", startDate, endDate, batch } = req.query

    // Build student query
    const studentQuery = { role: "student" }
    if (batch) {
      studentQuery.batch = batch
    }

    // Get all students
    const students = await User.find(studentQuery)

    // Build date query for attendance
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

    // Calculate statistics for each student
    const studentsSummary = []

    for (const student of students) {
      const attendanceRecords = await Attendance.find({
        student: student._id,
        ...dateQuery,
      })

      const totalSessions = attendanceRecords.length
      const presentCount = attendanceRecords.filter((a) => a.status === "present").length
      const absentCount = attendanceRecords.filter((a) => a.status === "absent").length
      const pendingCount = attendanceRecords.filter((a) => a.status === "pending").length
      const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0

      studentsSummary.push({
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        batch: student.batch,
        totalSessions,
        presentCount,
        absentCount,
        pendingCount,
        attendancePercentage,
      })
    }

    // Sort by attendance percentage (descending)
    studentsSummary.sort((a, b) => b.attendancePercentage - a.attendancePercentage)

    // Generate report based on requested format
    if (format === "json") {
      return res.status(200).json({
        success: true,
        count: studentsSummary.length,
        data: studentsSummary,
      })
    } else if (format === "csv" || format === "pdf") {
      const batchInfo = batch ? `_batch_${batch}` : ""
      const fileName = `students_summary${batchInfo}_${moment().format("YYYYMMDD")}`

      let filePath
      if (format === "csv") {
        filePath = await reportGenerator.generateCsvReport(studentsSummary, {
          reportType: "studentSummary",
          fileName,
        })
      } else {
        const subtitle = batch
          ? `Batch: ${batch} - ${startDate ? new Date(startDate).toLocaleDateString() : "All time"} to ${endDate ? new Date(endDate).toLocaleDateString() : "All time"}`
          : `${startDate ? new Date(startDate).toLocaleDateString() : "All time"} to ${endDate ? new Date(endDate).toLocaleDateString() : "All time"}`

        filePath = await reportGenerator.generatePdfReport(studentsSummary, {
          reportType: "studentSummary",
          fileName,
          title: "Students Attendance Summary Report",
          subtitle,
        })
      }

      // Send file
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          console.error("Error sending report file:", err)
        }

        // Delete file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting report file:", unlinkErr)
          }
        })
      })
    } else {
      return next(new ErrorResponse("Invalid report format. Supported formats: json, csv, pdf", 400))
    }
  } catch (err) {
    next(err)
  }
}

