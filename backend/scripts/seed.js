const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

// Load env vars
dotenv.config()

// Load models
const User = require("../models/User")
const Hospital = require("../models/Hospital")
const Attendance = require("../models/Attendance")
const Notification = require("../models/Notification")
const Session = require("../models/Session")

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)

// Seed data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany()
    await Hospital.deleteMany()
    await Attendance.deleteMany()
    await Notification.deleteMany()
    await Session.deleteMany()
    console.log("Cleared existing data")

    // Create admin user
    const adminPassword = await bcrypt.hash("password123", 10)
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin",
    })
    console.log("Created admin user")

    // Create faculty users
    const facultyPassword = await bcrypt.hash("password123", 10)
    const faculty1 = await User.create({
      name: "Dr. Jane Smith",
      email: "faculty1@example.com",
      password: facultyPassword,
      role: "faculty",
      department: "Cardiology",
    })

    const faculty2 = await User.create({
      name: "Dr. John Doe",
      email: "faculty2@example.com",
      password: facultyPassword,
      role: "faculty",
      department: "Neurology",
    })

    const faculty3 = await User.create({
      name: "Dr. Sarah Johnson",
      email: "faculty3@example.com",
      password: facultyPassword,
      role: "faculty",
      department: "Pediatrics",
    })
    console.log("Created faculty users")

    // Create student users
    const studentPassword = await bcrypt.hash("password123", 10)
    const students = []

    for (let i = 1; i <= 10; i++) {
      const student = await User.create({
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        password: studentPassword,
        role: "student",
        batch: "2023",
        rollNumber: `MED2023${i.toString().padStart(3, "0")}`,
      })
      students.push(student)
    }
    console.log("Created student users")

    // Create hospitals with addresses
    const hospital1 = await Hospital.create({
      name: "City General Hospital",
      address: "123 Main Street, New York, NY 10001",
      departments: ["Cardiology", "Neurology", "Pediatrics", "Orthopedics"],
    })

    const hospital2 = await Hospital.create({
      name: "University Medical Center",
      address: "456 College Avenue, Boston, MA 02115",
      departments: ["Cardiology", "Neurology", "Oncology", "Emergency Medicine"],
    })

    const hospital3 = await Hospital.create({
      name: "Memorial Health Institute",
      address: "789 Park Road, Chicago, IL 60601",
      departments: ["Pediatrics", "Obstetrics", "Surgery", "Psychiatry"],
    })

    const hospital4 = await Hospital.create({
      name: "Riverside Community Hospital",
      address: "321 River Lane, San Francisco, CA 94105",
      departments: ["Family Medicine", "Internal Medicine", "Geriatrics", "Rehabilitation"],
    })

    const hospital5 = await Hospital.create({
      name: "Central Medical Center",
      address: "555 Central Avenue, Miami, FL 33101",
      departments: ["Cardiology", "Dermatology", "Endocrinology", "Gastroenterology"],
    })
    console.log("Created hospitals")

    // Create sessions first
    const session1 = await Session.create({
      name: "Morning Rounds",
      description: "Daily morning rounds with patients",
      startTime: "09:00",
      endTime: "12:00",
      faculty: faculty1._id,
      hospital: hospital1._id,
      department: "Cardiology",
    })

    const session2 = await Session.create({
      name: "Afternoon Clinic",
      description: "Outpatient clinic sessions",
      startTime: "13:00",
      endTime: "16:00",
      faculty: faculty2._id,
      hospital: hospital2._id,
      department: "Neurology",
    })

    const session3 = await Session.create({
      name: "Pediatric Rounds",
      description: "Pediatric ward rounds",
      startTime: "08:30",
      endTime: "11:30",
      faculty: faculty3._id,
      hospital: hospital3._id,
      department: "Pediatrics",
    })
    console.log("Created sessions")

    // Create some attendance records
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Create attendance for some students
    for (let i = 0; i < 5; i++) {
      await Attendance.create({
        student: students[i]._id,
        faculty: faculty1._id,
        hospital: hospital1._id,
        session: session1._id,
        date: today,
        checkInTime: new Date(today.setHours(9, 0, 0)),
        checkOutTime: new Date(today.setHours(17, 0, 0)),
        status: "present",
        notes: "Regular attendance",
      })
    }

    for (let i = 5; i < 8; i++) {
      await Attendance.create({
        student: students[i]._id,
        faculty: faculty2._id,
        hospital: hospital2._id,
        session: session2._id,
        date: yesterday,
        checkInTime: new Date(yesterday.setHours(8, 30, 0)),
        checkOutTime: new Date(yesterday.setHours(16, 30, 0)),
        status: "present",
        notes: "Regular attendance",
      })
    }

    for (let i = 8; i < 10; i++) {
      await Attendance.create({
        student: students[i]._id,
        faculty: faculty3._id,
        hospital: hospital3._id,
        session: session3._id,
        date: twoDaysAgo,
        checkInTime: new Date(twoDaysAgo.setHours(9, 15, 0)),
        checkOutTime: new Date(twoDaysAgo.setHours(17, 15, 0)),
        status: "present",
        notes: "Regular attendance",
      })
    }
    console.log("Created attendance records")

    // Create some notifications - FIXED to include sender and user fields and valid type values
    for (let i = 0; i < 5; i++) {
      await Notification.create({
        title: "Attendance Reminder",
        message: `Don't forget to check in at ${hospital1.name} tomorrow.`,
        type: "info", // Changed from 'reminder' to a valid enum value
        read: false,
        user: students[i]._id, // Added user field
        sender: admin._id, // Added sender field (admin)
      })
    }

    for (let i = 5; i < 10; i++) {
      await Notification.create({
        title: "Schedule Change",
        message: "Your rotation schedule has been updated. Please check the portal.",
        type: "warning", // Changed from 'update' to a valid enum value
        read: i < 8, // Some read, some unread
        user: students[i]._id, // Added user field
        sender: faculty1._id, // Added sender field (faculty)
      })
    }

    // Faculty notifications
    await Notification.create({
      title: "New Students Assigned",
      message: "You have new students assigned to your supervision.",
      type: "info", // Changed from 'update' to a valid enum value
      read: false,
      user: faculty1._id, // Added user field
      sender: admin._id, // Added sender field (admin)
    })

    await Notification.create({
      title: "Attendance Report Due",
      message: "Please submit your monthly attendance report by the end of the week.",
      type: "warning", // Changed from 'reminder' to a valid enum value
      read: true,
      user: faculty2._id, // Added user field
      sender: admin._id, // Added sender field (admin)
    })

    console.log("Created notifications")

    console.log("Database seeded successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()

