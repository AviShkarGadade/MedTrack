"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export default function VerifyEmailPage() {
  const { user, firebaseUser, sendEmailVerification, logout, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (user?.emailVerified) {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else if (user.role === "faculty") {
        router.push("/faculty/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    }

    // If no user is logged in, redirect to login
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleResendEmail = async () => {
    try {
      await sendEmailVerification()
    } catch (error) {
      console.error("Error sending verification email:", error)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900">
              <MailCheck className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification email to <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please check your email and click on the verification link to complete your registration. If you don't see
            the email, check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleRefresh} className="w-full">
            I've verified my email
          </Button>
          <Button onClick={handleResendEmail} variant="outline" className="w-full" disabled={loading}>
            Resend verification email
          </Button>
          <Button onClick={logout} variant="ghost" className="w-full mt-2">
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

