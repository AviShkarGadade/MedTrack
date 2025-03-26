"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function LogoutPage() {
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    const performLogout = async () => {
      await logout()
      router.push("/login")
    }

    performLogout()
  }, [logout, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Logging out...</p>
    </div>
  )
}

