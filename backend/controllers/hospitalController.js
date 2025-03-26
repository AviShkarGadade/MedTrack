const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const Hospital = require("../models/Hospital")

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
exports.getHospitals = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
// @access  Public
exports.getHospital = asyncHandler(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id)

  if (!hospital) {
    return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: hospital,
  })
})

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private/Admin
exports.createHospital = asyncHandler(async (req, res, next) => {
  const hospital = await Hospital.create(req.body)

  res.status(201).json({
    success: true,
    data: hospital,
  })
})

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
exports.updateHospital = asyncHandler(async (req, res, next) => {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!hospital) {
    return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: hospital,
  })
})

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
exports.deleteHospital = asyncHandler(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id)

  if (!hospital) {
    return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
  }

  await hospital.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

