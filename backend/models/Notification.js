const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a notification title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  message: {
    type: String,
    required: [true, "Please add a notification message"],
    maxlength: [500, "Message cannot be more than 500 characters"],
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "error"],
    default: "info",
  },
  read: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Notification", NotificationSchema)

