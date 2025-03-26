const fs = require("fs")
const csv = require("csv-parser")
const path = require("path")

exports.parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = []

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results)
      })
      .on("error", (error) => {
        reject(error)
      })
  })
}

exports.mapCsvDataToUserModel = (data, role) => {
  switch (role) {
    case "student":
      return data.map((row) => ({
        name: row.name,
        email: row.email,
        password: row.password || generateRandomPassword(),
        role: "student",
        studentId: row.studentId,
        batch: row.batch,
      }))
    case "faculty":
      return data.map((row) => ({
        name: row.name,
        email: row.email,
        password: row.password || generateRandomPassword(),
        role: "faculty",
        facultyId: row.facultyId,
        department: row.department,
      }))
    default:
      throw new Error("Invalid role for bulk import")
  }
}

// Helper function to generate a random password
function generateRandomPassword() {
  const length = 10
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
  let password = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }

  return password
}

