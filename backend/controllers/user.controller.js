const User = require("../models/User")
const Attendance = require("../models/Attendance")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get student profile
// @route   GET /api/users/student/profile
// @access  Private/Student
exports.getStudentProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(new ErrorResponse("User not found", 404))
    }

    // Get attendance statistics
    const attendanceRecords = await Attendance.find({ student: req.user.id })
    const totalAttendance = attendanceRecords.length
    const presentAttendance = attendanceRecords.filter((record) => record.status === "present").length
    const attendancePercentage = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        batch: user.batch,
        totalAttendance,
        attendancePercentage,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get faculty profile
// @route   GET /api/users/faculty/profile
// @access  Private/Faculty
exports.getFacultyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(new ErrorResponse("User not found", 404))
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        facultyId: user.facultyId,
        department: user.department,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    }

    // Add role-specific fields
    if (req.user.role === "student" && req.body.batch) {
      fieldsToUpdate.batch = req.body.batch
    }

    if (req.user.role === "faculty" && req.body.department) {
      fieldsToUpdate.department = req.body.department
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get admin statistics
// @route   GET /api/users/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res, next) => {
  try {
    // Count users by role
    const totalStudents = await User.countDocuments({ role: "student" })
    const totalFaculty = await User.countDocuments({ role: "faculty" })

    // Get attendance by department
    const attendanceByDepartment = await Attendance.aggregate([
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "sessionData",
        },
      },
      { $unwind: "$sessionData" },
      {
        $group: {
          _id: "$sessionData.department",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalHospitals: await require("../models/Hospital").countDocuments(),
        totalSessions: await require("../models/AttendanceSession").countDocuments(),
        attendanceByDepartment,
      },
    })
  } catch (err) {
    next(err)
  }
}

