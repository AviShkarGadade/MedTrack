"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { UserProfile } from "@/components/user-profile"

export default function StudentProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <UserProfile />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

