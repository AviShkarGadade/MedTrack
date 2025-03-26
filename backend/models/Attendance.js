const mongoose = require("mongoose")

const AttendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.ObjectId,
    ref: "Session",
    required: true,
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
})

// Prevent student from submitting more than one attendance per session
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true })

module.exports = mongoose.model("Attendance", AttendanceSchema)

