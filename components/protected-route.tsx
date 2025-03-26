"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<"admin" | "faculty" | "student">
  requireVerified?: boolean
}

export function ProtectedRoute({ children, allowedRoles = [], requireVerified = true }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // User exists but email not verified
      if (requireVerified && user && !user.emailVerified) {
        router.push("/verify-email")
        return
      }

      // Check role-based access
      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        // Redirect based on role if user doesn't have permission
        if (user.role === "admin") {
          router.push("/admin/dashboard")
        } else if (user.role === "faculty") {
          router.push("/faculty/dashboard")
        } else {
          router.push("/student/dashboard")
        }
      }
    }
  }, [loading, isAuthenticated, user, router, allowedRoles, requireVerified])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requireVerified && user && !user.emailVerified) {
    return null
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

