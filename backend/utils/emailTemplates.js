/**
 * Email templates for various notifications
 */

// Welcome email template
exports.welcomeEmailTemplate = (name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">Welcome to MedTrack</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>Welcome to MedTrack, your comprehensive solution for tracking medical intern attendance at different hospitals.</p>
        <p>With MedTrack, you can:</p>
        <ul>
          <li>Mark your attendance at different hospitals</li>
          <li>View your attendance history</li>
          <li>Receive notifications about upcoming sessions</li>
          <li>Generate reports of your attendance</li>
        </ul>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

// Password reset email template
exports.passwordResetEmailTemplate = (name, resetUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">Password Reset</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
        <p>Please click on the following link to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>This link will expire in 10 minutes.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

// Attendance confirmation email template
exports.attendanceConfirmationEmailTemplate = (name, session, hospital, date) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">Attendance Confirmation</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>Your attendance has been successfully recorded for the following session:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Session:</strong> ${session}</p>
          <p><strong>Hospital:</strong> ${hospital}</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
        <p>Thank you for using MedTrack to record your attendance.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

// Attendance verification email template
exports.attendanceVerificationEmailTemplate = (name, session, hospital, date, verifiedBy) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">Attendance Verified</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>Your attendance has been verified for the following session:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Session:</strong> ${session}</p>
          <p><strong>Hospital:</strong> ${hospital}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Verified by:</strong> ${verifiedBy}</p>
        </div>
        <p>Thank you for your participation.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

// New session notification email template
exports.newSessionEmailTemplate = (name, session, hospital, date, time) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">New Session Scheduled</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>A new session has been scheduled:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Session:</strong> ${session}</p>
          <p><strong>Hospital:</strong> ${hospital}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        <p>Please make sure to attend and mark your attendance using the MedTrack application.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

// Monthly report email template
exports.monthlyReportEmailTemplate = (name, month, year, totalSessions, attendedSessions, verificationRate) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">Monthly Attendance Report</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>Here is your attendance report for ${month} ${year}:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Total Sessions:</strong> ${totalSessions}</p>
          <p><strong>Sessions Attended:</strong> ${attendedSessions}</p>
          <p><strong>Attendance Rate:</strong> ${((attendedSessions / totalSessions) * 100).toFixed(2)}%</p>
          <p><strong>Verification Rate:</strong> ${verificationRate}%</p>
        </div>
        <p>You can view more detailed reports in the MedTrack application.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

// Bulk import completion email template
exports.bulkImportCompletionEmailTemplate = (name, total, success, failed) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6;">Bulk Import Completed</h1>
      </div>
      <div>
        <p>Hello ${name},</p>
        <p>The bulk import process has been completed with the following results:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Total Records:</strong> ${total}</p>
          <p><strong>Successfully Imported:</strong> ${success}</p>
          <p><strong>Failed:</strong> ${failed}</p>
        </div>
        <p>You can view more details in the MedTrack application.</p>
        <p>Best regards,<br>The MedTrack Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
        <p>&copy; ${new Date().getFullYear()} MedTrack. All rights reserved.</p>
      </div>
    </div>
  `
}

