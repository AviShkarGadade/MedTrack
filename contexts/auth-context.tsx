"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  registerWithEmailPassword,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  getCurrentUserData,
  sendVerificationEmail,
  type UserData,
} from "@/lib/firebase-auth"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: UserData | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  registerWithEmail: (
    email: string,
    password: string,
    name: string,
    role: "admin" | "faculty" | "student",
  ) => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  sendEmailVerification: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)

      if (firebaseUser) {
        try {
          const userData = await getCurrentUserData(firebaseUser)
          setUser(userData)
          setFirebaseUser(firebaseUser)
          setIsAuthenticated(true)
        } catch (error: any) {
          console.error("Error getting user data:", error)
          // Don't sign out the user if there's an error getting their data
          // Just set the basic information we have from Firebase Auth
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            role: "student", // Default role if we can't get from Firestore
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL || undefined,
          })
          setFirebaseUser(firebaseUser)
          setIsAuthenticated(true)

          toast({
            title: "Warning",
            description: "Some user data could not be loaded. You may have limited functionality.",
            variant: "destructive",
          })
        }
      } else {
        setUser(null)
        setFirebaseUser(null)
        setIsAuthenticated(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [toast])

  const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: "admin" | "faculty" | "student",
  ) => {
    try {
      setLoading(true)
      await registerWithEmailPassword(email, password, name, role)

      toast({
        title: "Registration successful",
        description: "Please check your email for verification.",
      })

      router.push("/login")
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const userData = await signInWithEmail(email, password)

      setUser(userData)
      setIsAuthenticated(true)

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.displayName}!`,
      })

      // Redirect based on role and email verification
      if (!userData.emailVerified) {
        router.push("/verify-email")
      } else if (userData.role === "admin") {
        router.push("/admin/dashboard")
      } else if (userData.role === "faculty") {
        router.push("/faculty/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setLoading(true)
      const userData = await signInWithGoogle()

      setUser(userData)
      setIsAuthenticated(true)

      toast({
        title: "Login successful",
        description: `Welcome, ${userData.displayName}!`,
      })

      // Redirect based on role
      if (userData.role === "admin") {
        router.push("/admin/dashboard")
      } else if (userData.role === "faculty") {
        router.push("/faculty/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    } catch (error: any) {
      console.error("Google login error:", error)
      toast({
        title: "Login failed",
        description: error.message || "There was an error signing in with Google.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOutUser()

      setUser(null)
      setFirebaseUser(null)
      setIsAuthenticated(false)

      router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: error.message || "There was an error signing out.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendEmailVerification = async () => {
    try {
      if (!firebaseUser) {
        throw new Error("No user is currently signed in")
      }

      await sendVerificationEmail(firebaseUser)

      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      console.error("Email verification error:", error)
      toast({
        title: "Failed to send verification email",
        description: error.message || "There was an error sending the verification email.",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        sendEmailVerification,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

