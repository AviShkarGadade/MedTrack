const Hospital = require("../models/Hospital")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private
exports.getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find()

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
// @access  Private
exports.getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id)

    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
    }

    res.status(200).json({
      success: true,
      data: hospital,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private/Admin
exports.createHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.create(req.body)

    res.status(201).json({
      success: true,
      data: hospital,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
exports.updateHospital = async (req, res, next) => {
  try {
    let hospital = await Hospital.findById(req.params.id)

    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
    }

    hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: hospital,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
exports.deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id)

    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
    }

    await hospital.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Add department to hospital
// @route   POST /api/hospitals/:id/departments
// @access  Private/Admin
exports.addDepartment = async (req, res, next) => {
  try {
    const { departmentName } = req.body

    if (!departmentName) {
      return next(new ErrorResponse("Please provide a department name", 400))
    }

    const hospital = await Hospital.findById(req.params.id)

    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
    }

    // Check if department already exists
    if (hospital.departments.includes(departmentName)) {
      return next(new ErrorResponse(`Department ${departmentName} already exists`, 400))
    }

    hospital.departments.push(departmentName)
    await hospital.save()

    res.status(200).json({
      success: true,
      data: hospital,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Remove department from hospital
// @route   DELETE /api/hospitals/:id/departments/:departmentName
// @access  Private/Admin
exports.removeDepartment = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id)

    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404))
    }

    const departmentIndex = hospital.departments.indexOf(req.params.departmentName)

    if (departmentIndex === -1) {
      return next(new ErrorResponse(`Department ${req.params.departmentName} not found`, 404))
    }

    hospital.departments.splice(departmentIndex, 1)
    await hospital.save()

    res.status(200).json({
      success: true,
      data: hospital,
    })
  } catch (err) {
    next(err)
  }
}

