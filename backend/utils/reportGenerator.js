const fs = require("fs")
const path = require("path")
const PDFDocument = require("pdfkit")
const { createObjectCsvWriter } = require("csv-writer")
const moment = require("moment")

// Generate CSV report
exports.generateCsvReport = async (data, options) => {
  const { reportType, fileName } = options

  // Set up the CSV writer
  const csvWriter = createObjectCsvWriter({
    path: path.join(__dirname, "../reports", `${fileName}.csv`),
    header: getReportHeader(reportType),
  })

  // Format data for CSV
  const formattedData = formatDataForReport(data, reportType)

  // Write data to CSV
  await csvWriter.writeRecords(formattedData)

  return path.join(__dirname, "../reports", `${fileName}.csv`)
}

// Generate PDF report
exports.generatePdfReport = async (data, options) => {
  const { reportType, fileName, title, subtitle } = options

  return new Promise((resolve, reject) => {
    try {
      const pdfPath = path.join(__dirname, "../reports", `${fileName}.pdf`)
      const doc = new PDFDocument({ margin: 50 })

      // Pipe output to file
      const stream = fs.createWriteStream(pdfPath)
      doc.pipe(stream)

      // Add report metadata
      doc.info.Title = title
      doc.info.Author = "MedTrack System"

      // Add header
      doc
        .fontSize(20)
        .text(title, { align: "center" })
        .fontSize(12)
        .text(subtitle, { align: "center" })
        .text(`Generated on: ${moment().format("MMMM Do YYYY, h:mm:ss a")}`, { align: "center" })
        .moveDown(2)

      // Add table header
      const headers = getReportHeader(reportType).map((header) => header.title)
      const headerPositions = calculateColumnPositions(headers, doc.page.width - 100)

      doc.font("Helvetica-Bold")
      headers.forEach((header, i) => {
        doc.text(header, headerPositions[i], doc.y, { continued: i < headers.length - 1 })
      })
      doc.moveDown()

      // Add horizontal line
      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()
        .moveDown(0.5)

      // Add table rows
      doc.font("Helvetica")
      const formattedData = formatDataForReport(data, reportType)

      formattedData.forEach((row, rowIndex) => {
        // Add a new page if we're at the bottom
        if (doc.y > doc.page.height - 150) {
          doc.addPage()
        }

        const rowValues = Object.values(row)
        rowValues.forEach((value, i) => {
          doc.text(value.toString(), headerPositions[i], doc.y, {
            continued: i < rowValues.length - 1,
            width: headerPositions[i + 1] ? headerPositions[i + 1] - headerPositions[i] - 10 : undefined,
          })
        })
        doc.moveDown()

        // Add a light line between rows
        if (rowIndex < formattedData.length - 1) {
          doc
            .strokeColor("#eeeeee")
            .lineWidth(0.5)
            .moveTo(50, doc.y - 5)
            .lineTo(doc.page.width - 50, doc.y - 5)
            .stroke()
        }
      })

      // Add footer
      const footerTop = doc.page.height - 50
      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, footerTop)
        .lineTo(doc.page.width - 50, footerTop)
        .stroke()

      doc
        .fontSize(10)
        .text("MedTrack - Medical Intern Attendance Tracking System", 50, footerTop + 15, { align: "center" })

      // Finalize document
      doc.end()

      stream.on("finish", () => {
        resolve(pdfPath)
      })

      stream.on("error", (err) => {
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Helper functions
function getReportHeader(reportType) {
  switch (reportType) {
    case "studentAttendance":
      return [
        { id: "date", title: "Date" },
        { id: "hospital", title: "Hospital" },
        { id: "department", title: "Department" },
        { id: "status", title: "Status" },
        { id: "verifiedBy", title: "Verified By" },
      ]
    case "facultyAttendance":
      return [
        { id: "date", title: "Date" },
        { id: "hospital", title: "Hospital" },
        { id: "department", title: "Department" },
        { id: "totalStudents", title: "Total Students" },
        { id: "presentCount", title: "Present" },
        { id: "absentCount", title: "Absent" },
        { id: "pendingCount", title: "Pending" },
      ]
    case "hospitalReport":
      return [
        { id: "hospital", title: "Hospital" },
        { id: "department", title: "Department" },
        { id: "sessionCount", title: "Sessions" },
        { id: "attendanceCount", title: "Total Attendance" },
        { id: "presentPercent", title: "Present %" },
      ]
    case "studentSummary":
      return [
        { id: "studentId", title: "Student ID" },
        { id: "name", title: "Name" },
        { id: "totalSessions", title: "Total Sessions" },
        { id: "presentCount", title: "Present" },
        { id: "absentCount", title: "Absent" },
        { id: "attendance", title: "Attendance %" },
      ]
    default:
      return []
  }
}

function formatDataForReport(data, reportType) {
  switch (reportType) {
    case "studentAttendance":
      return data.map((record) => ({
        date: moment(record.date).format("DD/MM/YYYY"),
        hospital: record.hospital,
        department: record.department,
        status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
        verifiedBy: record.verifiedBy || "N/A",
      }))
    case "facultyAttendance":
      return data.map((session) => ({
        date: moment(session.date).format("DD/MM/YYYY"),
        hospital: session.hospital,
        department: session.department,
        totalStudents: session.totalStudents,
        presentCount: session.presentCount,
        absentCount: session.absentCount,
        pendingCount: session.pendingCount,
      }))
    case "hospitalReport":
      return data.map((item) => ({
        hospital: item.hospital,
        department: item.department,
        sessionCount: item.sessionCount,
        attendanceCount: item.attendanceCount,
        presentPercent: `${item.presentPercent.toFixed(2)}%`,
      }))
    case "studentSummary":
      return data.map((student) => ({
        studentId: student.studentId,
        name: student.name,
        totalSessions: student.totalSessions,
        presentCount: student.presentCount,
        absentCount: student.absentCount,
        attendance: `${student.attendancePercentage.toFixed(2)}%`,
      }))
    default:
      return data
  }
}

function calculateColumnPositions(headers, availableWidth) {
  const positions = [50] // Start at left margin
  const columnWidth = availableWidth / headers.length

  for (let i = 1; i < headers.length; i++) {
    positions.push(50 + columnWidth * i)
  }

  return positions
}

