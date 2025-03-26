const asyncHandler = require("../middleware/async")
const ErrorResponse = require("../utils/errorResponse")
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const csv = require("csv-parser")
const fs = require("fs")
const path = require("path")
const multer = require("multer")
const { v4: uuidv4 } = require("uuid")
const { sendEmail } = require("../utils/emailService")
const { bulkImportCompletionEmailTemplate } = require("../utils/emailTemplates")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir)
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true)
    } else {
      cb(new Error("Only CSV files are allowed"), false)
    }
  },
}).single("file")

// Store import status
const importStatus = new Map()

// @desc    Import users from CSV
// @route   POST /api/v1/import/users
// @access  Private (Admin)
exports.importUsers = asyncHandler(async (req, res, next) => {
  // Use multer to handle file upload
  upload(req, res, async (err) => {
    if (err) {
      return next(new ErrorResponse(`Error uploading file: ${err.message}`, 400))
    }

    if (!req.file) {
      return next(new ErrorResponse("Please upload a CSV file", 400))
    }

    const importId = uuidv4()
    const filePath = req.file.path

    // Initialize import status
    importStatus.set(importId, {
      status: "processing",
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      errors: [],
    })

    // Process the file asynchronously
    processUserImport(filePath, importId, req.user)

    res.status(202).json({
      success: true,
      data: {
        message: "Import started",
        importId,
      },
    })
  })
})

// Process user import asynchronously
const processUserImport = async (filePath, importId, user) => {
  const results = []
  const status = importStatus.get(importId)

  try {
    // Read and parse the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject)
    })

    status.total = results.length

    // Process each row
    for (const row of results) {
      try {
        status.processed++

        // Validate required fields
        if (!row.name || !row.email || !row.role) {
          throw new Error("Missing required fields (name, email, or role)")
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: row.email })
        if (existingUser) {
          throw new Error(`User with email ${row.email} already exists`)
        }

        // Generate a random password
        const password = Math.random().toString(36).slice(-8)

        // Create the user
        await User.create({
          name: row.name,
          email: row.email,
          role: row.role.toLowerCase(),
          password,
          // Add other fields as needed
        })

        status.success++
      } catch (error) {
        status.failed++
        status.errors.push({
          row: status.processed,
          email: row.email || "Unknown",
          error: error.message,
        })
      }

      // Update status
      importStatus.set(importId, status)
    }

    // Update final status
    status.status = "completed"
    importStatus.set(importId, status)

    // Clean up the file
    fs.unlinkSync(filePath)

    // Send notification email to admin
    await sendEmail({
      email: user.email,
      subject: "Bulk User Import Completed",
      html: bulkImportCompletionEmailTemplate(user.name, status.total, status.success, status.failed),
    })
  } catch (error) {
    status.status = "failed"
    status.errors.push({
      error: error.message,
    })
    importStatus.set(importId, status)

    // Clean up the file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

// @desc    Import hospitals from CSV
// @route   POST /api/v1/import/hospitals
// @access  Private (Admin)
exports.importHospitals = asyncHandler(async (req, res, next) => {
  // Use multer to handle file upload
  upload(req, res, async (err) => {
    if (err) {
      return next(new ErrorResponse(`Error uploading file: ${err.message}`, 400))
    }

    if (!req.file) {
      return next(new ErrorResponse("Please upload a CSV file", 400))
    }

    const importId = uuidv4()
    const filePath = req.file.path

    // Initialize import status
    importStatus.set(importId, {
      status: "processing",
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      errors: [],
    })

    // Process the file asynchronously
    processHospitalImport(filePath, importId, req.user)

    res.status(202).json({
      success: true,
      data: {
        message: "Import started",
        importId,
      },
    })
  })
})

// Process hospital import asynchronously
const processHospitalImport = async (filePath, importId, user) => {
  const results = []
  const status = importStatus.get(importId)

  try {
    // Read and parse the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject)
    })

    status.total = results.length

    // Process each row
    for (const row of results) {
      try {
        status.processed++

        // Validate required fields
        if (!row.name || !row.address) {
          throw new Error("Missing required fields (name or address)")
        }

        // Check if hospital already exists
        const existingHospital = await Hospital.findOne({ name: row.name })
        if (existingHospital) {
          throw new Error(`Hospital with name ${row.name} already exists`)
        }

        // Create the hospital
        await Hospital.create({
          name: row.name,
          address: row.address,
          city: row.city || "",
          state: row.state || "",
          zipCode: row.zipCode || "",
          phone: row.phone || "",
          email: row.email || "",
          website: row.website || "",
          // Add other fields as needed
        })

        status.success++
      } catch (error) {
        status.failed++
        status.errors.push({
          row: status.processed,
          name: row.name || "Unknown",
          error: error.message,
        })
      }

      // Update status
      importStatus.set(importId, status)
    }

    // Update final status
    status.status = "completed"
    importStatus.set(importId, status)

    // Clean up the file
    fs.unlinkSync(filePath)

    // Send notification email to admin
    await sendEmail({
      email: user.email,
      subject: "Bulk Hospital Import Completed",
      html: bulkImportCompletionEmailTemplate(user.name, status.total, status.success, status.failed),
    })
  } catch (error) {
    status.status = "failed"
    status.errors.push({
      error: error.message,
    })
    importStatus.set(importId, status)

    // Clean up the file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

// @desc    Get import status
// @route   GET /api/v1/import/status/:importId
// @access  Private (Admin)
exports.getImportStatus = asyncHandler(async (req, res, next) => {
  const { importId } = req.params

  if (!importStatus.has(importId)) {
    return next(new ErrorResponse(`Import with ID ${importId} not found`, 404))
  }

  res.status(200).json({
    success: true,
    data: importStatus.get(importId),
  })
})

