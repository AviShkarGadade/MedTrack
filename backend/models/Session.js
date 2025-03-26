const mongoose = require("mongoose")

const SessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a session name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  startTime: {
    type: String,
    required: [true, "Please add a start time"],
  },
  endTime: {
    type: String,
    required: [true, "Please add an end time"],
  },
  faculty: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Please add a faculty member"],
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: "Hospital",
    required: [true, "Please add a hospital"],
  },
  department: {
    type: String,
    required: [true, "Please add a department"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Session", SessionSchema)

