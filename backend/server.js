const path = require("path")
const express = require("express")
const dotenv = require("dotenv")
const morgan = require("morgan")
const colors = require("colors")
const cookieParser = require("cookie-parser")
const mongoSanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require("xss-clean")
const rateLimit = require("express-rate-limit")
const cors = require("cors")
const errorHandler = require("./middleware/error")
const connectDB = require("./config/db")

// Load env vars
dotenv.config()

// Connect to database
connectDB()

// Route files
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const hospitalRoutes = require("./routes/hospitalRoutes")
const attendanceRoutes = require("./routes/attendanceRoutes")
const reportRoutes = require("./routes/reportRoutes")
const analyticsRoutes = require("./routes/analyticsRoutes")
const importRoutes = require("./routes/importRoutes")
const notificationRoutes = require("./routes/notificationRoutes")

const app = express()

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// Sanitize data
app.use(mongoSanitize())

// Set security headers
app.use(helmet())

// Prevent XSS attacks
app.use(xss())

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
})
app.use(limiter)

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
)

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Mount routers
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/hospitals", hospitalRoutes)
app.use("/api/v1/attendance", attendanceRoutes)
app.use("/api/v1/reports", reportRoutes)
app.use("/api/v1/analytics", analyticsRoutes)
app.use("/api/v1/import", importRoutes)
app.use("/api/v1/notifications", notificationRoutes)

// Error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold),
)

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red)
  // Close server & exit process
  server.close(() => process.exit(1))
})

