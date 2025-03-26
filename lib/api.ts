const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || data.message || "API request failed")
  }
  return data
}

// Authentication API calls
export async function loginUser(credentials: { email: string; password: string; role?: string }) {
  try {
    // Remove role from credentials if it's being sent to the backend
    // as the backend might not be expecting it in the request body
    const { role, ...loginCredentials } = credentials

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginCredentials),
      credentials: "include",
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Login error:", error)
    throw new Error(error.message || "Login failed")
  }
}

export async function registerUser(userData: any) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Registration error:", error)
    throw new Error(error.message || "Registration failed")
  }
}

export async function logoutUser() {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Logout error:", error)
    throw new Error(error.message || "Logout failed")
  }
}

export async function getCurrentUser() {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get current user error:", error)
    throw new Error(error.message || "Failed to fetch user data")
  }
}

// User API calls
export async function updateUserProfile(userData: any) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/users/updateDetails`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Update profile error:", error)
    throw new Error(error.message || "Failed to update profile")
  }
}

export async function updatePassword(passwordData: { currentPassword: string; newPassword: string }) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/auth/updatepassword`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Update password error:", error)
    throw new Error(error.message || "Failed to update password")
  }
}

// Attendance API calls
export async function markAttendance(attendanceData: any) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/attendances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(attendanceData),
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Mark attendance error:", error)
    throw new Error(error.message || "Failed to mark attendance")
  }
}

export async function getAttendanceHistory(params: { page?: number; limit?: number; sort?: string } = {}) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.sort) queryParams.append("sort", params.sort)

    const response = await fetch(`${API_URL}/attendances?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get attendance history error:", error)
    throw new Error(error.message || "Failed to fetch attendance history")
  }
}

// Session API calls
export async function createSession(sessionData: any) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sessionData),
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Create session error:", error)
    throw new Error(error.message || "Failed to create session")
  }
}

export async function getSessions(params: { page?: number; limit?: number; sort?: string } = {}) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.sort) queryParams.append("sort", params.sort)

    const response = await fetch(`${API_URL}/sessions?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get sessions error:", error)
    throw new Error(error.message || "Failed to fetch sessions")
  }
}

export async function getSessionById(id: string) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get session error:", error)
    throw new Error(error.message || "Failed to fetch session")
  }
}

// Hospital API calls
export async function getHospitals(params: { page?: number; limit?: number; sort?: string } = {}) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.sort) queryParams.append("sort", params.sort)

    const response = await fetch(`${API_URL}/hospitals?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get hospitals error:", error)
    throw new Error(error.message || "Failed to fetch hospitals")
  }
}

// Notification API calls
export async function getNotifications(params: { page?: number; limit?: number; read?: boolean } = {}) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.read !== undefined) queryParams.append("read", params.read.toString())

    const response = await fetch(`${API_URL}/notifications?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get notifications error:", error)
    throw new Error(error.message || "Failed to fetch notifications")
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Mark notification as read error:", error)
    throw new Error(error.message || "Failed to mark notification as read")
  }
}

// Analytics API calls
export async function getAnalytics() {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_URL}/analytics`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return handleResponse(response)
  } catch (error: any) {
    console.error("Get analytics error:", error)
    throw new Error(error.message || "Failed to fetch analytics data")
  }
}

// Export all API functions
export default {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  updatePassword,
  markAttendance,
  getAttendanceHistory,
  createSession,
  getSessions,
  getSessionById,
  getHospitals,
  getNotifications,
  markNotificationAsRead,
  getAnalytics,
}

