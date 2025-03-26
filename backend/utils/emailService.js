const nodemailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
const handlebars = require("handlebars")

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Load email templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.hbs`)
  const templateSource = fs.readFileSync(templatePath, "utf-8")
  return handlebars.compile(templateSource)
}

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {String} options.email - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - Email HTML content
 */
exports.sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  }

  // Send email
  await transporter.sendMail(mailOptions)
}

// Send email to faculty for attendance verification
exports.sendAttendanceVerificationEmail = async (options) => {
  const { facultyEmail, facultyName, studentName, studentEmail, sessionDate, hospitalName, attendanceId } = options

  const subject = `Attendance Verification Request - ${studentName}`

  const message = `
    Dear ${facultyName},

    ${studentName} (${studentEmail}) has marked attendance for your session on ${new Date(sessionDate).toLocaleString()} at ${hospitalName}.

    Please verify this attendance by clicking on the following link:
    ${process.env.FRONTEND_URL}/verify-attendance/${attendanceId}

    If you did not conduct this session or the student was not present, please ignore this email.

    Thank you,
    MedTrack Team
  `

  await exports.sendEmail({
    email: facultyEmail,
    subject,
    html: message,
  })
}

// Send session creation notification to students
exports.sendSessionCreationEmail = async (students, session) => {
  try {
    const template = loadTemplate("session-created")

    // Send emails to all students
    const emailPromises = students.map((student) => {
      const html = template({
        name: student.name,
        hospital: session.hospital.name,
        department: session.department,
        date: new Date(session.date).toLocaleString(),
        facultyName: session.faculty.name,
        loginUrl: `${process.env.FRONTEND_URL}/student/mark-attendance`,
      })

      return exports.sendEmail({
        email: student.email,
        subject: "New Attendance Session Created",
        html,
      })
    })

    await Promise.all(emailPromises)
    return true
  } catch (error) {
    console.error("Failed to send session creation emails:", error)
    return false
  }
}

// Send welcome email to new users
exports.sendWelcomeEmail = async (user) => {
  try {
    const template = loadTemplate("welcome")

    const html = template({
      name: user.name,
      role: user.role,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    })

    await exports.sendEmail({
      email: user.email,
      subject: "Welcome to MedTrack",
      html,
    })

    return true
  } catch (error) {
    console.error("Failed to send welcome email:", error)
    return false
  }
}

