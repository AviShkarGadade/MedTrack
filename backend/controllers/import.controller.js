const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const csvParser = require("../utils/csvParser")
const emailService = require("../utils/emailService")
const fs = require("fs")
const path = require("path")

// @desc    Bulk import users
// @route   POST /api/import/users
// @access  Private/Admin
exports.bulkImportUsers = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      return next(new ErrorResponse("Please upload a CSV file", 400))
    }

    const file = req.files.file
    const { role } = req.body

    // Validate role
    if (!role || !["student", "faculty"].includes(role)) {
      return next(new ErrorResponse("Please provide a valid role (student or faculty)", 400))
    }

    // Validate file type
    if (file.mimetype !== "text/csv") {
      return next(new ErrorResponse("Please upload a CSV file", 400))
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Save the file temporarily
    const filePath = path.join(uploadsDir, `${Date.now()}_${file.name}`)

    await file.mv(filePath)

    // Parse the CSV file
    const csvData = await csvParser.parseCsvFile(filePath)

    // Map CSV data to user model
    const usersData = csvParser.mapCsvDataToUserModel(csvData, role)

    // Process user data and handle duplicates
    const results = {
      success: [],
      error: [],
    }

    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email },
            ...(userData.studentId ? [{ studentId: userData.studentId }] : []),
            ...(userData.facultyId ? [{ facultyId: userData.facultyId }] : []),
          ],
        })

        if (existingUser) {
          results.error.push({
            userData,
            error: "User already exists with this email or ID",
          })
          continue
        }

        // Create the user
        const user = await User.create(userData)

        // Send welcome email
        emailService.sendWelcomeEmail(user).catch((err) => {
          console.error("Failed to send welcome email:", err)
        })

        results.success.push({
          name: user.name,
          email: user.email,
          role: user.role,
          ...(user.studentId && { studentId: user.studentId }),
          ...(user.facultyId && { facultyId: user.facultyId }),
        })
      } catch (error) {
        results.error.push({
          userData,
          error: error.message,
        })
      }
    }

    // Delete the temporary file
    fs.unlinkSync(filePath)

    res.status(200).json({
      success: true,
      data: {
        totalProcessed: usersData.length,
        successCount: results.success.length,
        errorCount: results.error.length,
        results,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Download user import template
// @route   GET /api/import/template/:role
// @access  Private/Admin
exports.downloadImportTemplate = (req, res, next) => {
  try {
    const { role } = req.params

    // Validate role
    if (!role || !["student", "faculty"].includes(role)) {
      return next(new ErrorResponse("Please provide a valid role (student or faculty)", 400))
    }

    // Define template path
    const templatePath = path.join(__dirname, `../templates/import/${role}_template.csv`)

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return next(new ErrorResponse("Template not found", 404))
    }

    // Send the template
    res.download(templatePath, `${role}_import_template.csv`)
  } catch (err) {
    next(err)
  }
}

