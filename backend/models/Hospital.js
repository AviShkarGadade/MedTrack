const mongoose = require("mongoose")
const geocoder = require("../utils/geocoder")

const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    unique: true,
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  address: {
    type: String,
    required: [true, "Please add an address"],
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  departments: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Geocode & create location field
HospitalSchema.pre("save", async function (next) {
  try {
    if (process.env.GEOCODER_API_KEY && process.env.GEOCODER_PROVIDER) {
      const loc = await geocoder.geocode(this.address)
      this.location = {
        type: "Point",
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode,
      }
    } else {
      // If geocoder is not configured, set default location
      this.location = {
        type: "Point",
        coordinates: [0, 0],
        formattedAddress: this.address,
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
      }
      console.warn("Geocoder not configured. Using default location.")
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    // Set default location on error
    this.location = {
      type: "Point",
      coordinates: [0, 0],
      formattedAddress: this.address,
      street: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
    }
  }

  // Do not save address in DB if you want to hide it
  // this.address = undefined;
  next()
})

module.exports = mongoose.model("Hospital", HospitalSchema)

