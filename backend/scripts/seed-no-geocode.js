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
    console.log("Cleared existing data")

    // Create admin user
    const adminPassword = await bcrypt.hash("password123", 10)
    await User.create({
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

    // Create hospitals with manual location data (no geocoding)
    const hospital1 = await Hospital.create({
      name: "City General Hospital",
      address: "123 Main Street, New York, NY 10001",
      departments: ["Cardiology", "Neurology", "Pediatrics", "Orthopedics"],
      location: {
        type: "Point",
        coordinates: [-74.005974, 40.712776], // New York coordinates
        formattedAddress: "123 Main Street, New York, NY 10001",
        street: "Main Street",
        city: "New York",
        state: "NY",
        zipcode: "10001",
        country: "US",
      },
    })

    const hospital2 = await Hospital.create({
      name: "University Medical Center",
      address: "456 College Avenue, Boston, MA 02115",
      departments: ["Cardiology", "Neurology", "Oncology", "Emergency Medicine"],
      location: {
        type: "Point",
        coordinates: [-71.0589, 42.3601], // Boston coordinates
        formattedAddress: "456 College Avenue, Boston, MA 02115",
        street: "College Avenue",
        city: "Boston",
        state: "MA",
        zipcode: "02115",
        country: "US",
      },
    })

    const hospital3 = await Hospital.create({
      name: "Memorial Health Institute",
      address: "789 Park Road, Chicago, IL 60601",
      departments: ["Pediatrics", "Obstetrics", "Surgery", "Psychiatry"],
      location: {
        type: "Point",
        coordinates: [-87.6298, 41.8781], // Chicago coordinates
        formattedAddress: "789 Park Road, Chicago, IL 60601",
        street: "Park Road",
        city: "Chicago",
        state: "IL",
        zipcode: "60601",
        country: "US",
      },
    })

    const hospital4 = await Hospital.create({
      name: "Riverside Community Hospital",
      address: "321 River Lane, San Francisco, CA 94105",
      departments: ["Family Medicine", "Internal Medicine", "Geriatrics", "Rehabilitation"],
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749], // San Francisco coordinates
        formattedAddress: "321 River Lane, San Francisco, CA 94105",
        street: "River Lane",
        city: "San Francisco",
        state: "CA",
        zipcode: "94105",
        country: "US",
      },
    })

    const hospital5 = await Hospital.create({
      name: "Central Medical Center",
      address: "555 Central Avenue, Miami, FL 33101",
      departments: ["Cardiology", "Dermatology", "Endocrinology", "Gastroenterology"],
      location: {
        type: "Point",
        coordinates: [-80.1918, 25.7617], // Miami coordinates
        formattedAddress: "555 Central Avenue, Miami, FL 33101",
        street: "Central Avenue",
        city: "Miami",
        state: "FL",
        zipcode: "33101",
        country: "US",
      },
    })
    console.log("Created hospitals")

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
        date: twoDaysAgo,
        checkInTime: new Date(twoDaysAgo.setHours(9, 15, 0)),
        checkOutTime: new Date(twoDaysAgo.setHours(17, 15, 0)),
        status: "present",
        notes: "Regular attendance",
      })
    }
    console.log("Created attendance records")

    // Create some notifications
    for (let i = 0; i < 5; i++) {
      await Notification.create({
        recipient: students[i]._id,
        title: "Attendance Reminder",
        message: `Don't forget to check in at ${hospital1.name} tomorrow.`,
        type: "reminder",
        read: false,
      })
    }

    for (let i = 5; i < 10; i++) {
      await Notification.create({
        recipient: students[i]._id,
        title: "Schedule Change",
        message: "Your rotation schedule has been updated. Please check the portal.",
        type: "update",
        read: i < 8, // Some read, some unread
      })
    }

    // Faculty notifications
    await Notification.create({
      recipient: faculty1._id,
      title: "New Students Assigned",
      message: "You have new students assigned to your supervision.",
      type: "update",
      read: false,
    })

    await Notification.create({
      recipient: faculty2._id,
      title: "Attendance Report Due",
      message: "Please submit your monthly attendance report by the end of the week.",
      type: "reminder",
      read: true,
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

