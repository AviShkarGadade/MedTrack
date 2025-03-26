/**
 * Utility to verify if a location is within range of a given point
 */

// Calculate distance between two points using Haversine formula
exports.calculateDistance = (point1, point2) => {
  const [lon1, lat1] = point1
  const [lon2, lat2] = point2

  // Convert latitude and longitude from degrees to radians
  const radLat1 = (lat1 * Math.PI) / 180
  const radLon1 = (lon1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180
  const radLon2 = (lon2 * Math.PI) / 180

  // Haversine formula
  const dlon = radLon2 - radLon1
  const dlat = radLat2 - radLat1
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dlon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Radius of earth in meters
  const radius = 6371000

  // Calculate the distance
  return radius * c
}

// Check if a point is within a certain radius of another point
exports.isLocationWithinRange = (point, centerPoint, radius) => {
  const distance = this.calculateDistance(point, centerPoint)
  return distance <= radius
}

