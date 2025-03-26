import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

export interface UserData {
  uid: string
  email: string
  displayName: string
  role: "admin" | "faculty" | "student"
  emailVerified: boolean
  photoURL?: string
  createdAt?: any
  lastLogin?: any
}

// Register with email and password
export const registerWithEmailPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: "admin" | "faculty" | "student",
): Promise<UserData> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with display name
    await updateProfile(user, { displayName })

    // Send verification email
    await sendEmailVerification(user)

    // Create user data object
    const userData: Omit<UserData, "uid" | "emailVerified"> & { createdAt: any; lastLogin: any } = {
      email: user.email || "",
      displayName,
      role,
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    }

    // Store user data in Firestore
    // Important: We're using set with merge option to ensure we don't overwrite existing data
    await setDoc(doc(db, "users", user.uid), userData, { merge: true })

    return {
      uid: user.uid,
      email: user.email || "",
      displayName,
      role,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || undefined,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
    }
  } catch (error: any) {
    console.error("Error registering user:", error)
    throw new Error(error.message || "Failed to register")
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<UserData> => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update last login timestamp
    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    })

    // Get user data from Firestore
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // If user exists in Auth but not in Firestore, create a basic record
      const basicUserData = {
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
        role: "student", // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }

      await setDoc(userRef, basicUserData)

      return {
        uid: user.uid,
        email: user.email || "",
        displayName: basicUserData.displayName,
        role: "student",
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      }
    }

    const userData = userDoc.data() as Omit<UserData, "uid" | "email" | "emailVerified">

    return {
      uid: user.uid,
      email: user.email || "",
      displayName: userData.displayName,
      role: userData.role,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || userData.photoURL,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
    }
  } catch (error: any) {
    console.error("Error signing in:", error)
    throw new Error(error.message || "Failed to sign in")
  }
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserData> => {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Check if user exists in Firestore
    const userRef = doc(db, "users", user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // First time Google sign-in, create user with default role
      const newUserData = {
        email: user.email,
        displayName: user.displayName || "",
        role: "student", // Default role for Google sign-in
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }

      await setDoc(userRef, newUserData)

      return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        role: "student",
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      }
    }

    // Update last login timestamp
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    })

    // User exists, return their data
    const userData = userDoc.data() as Omit<UserData, "uid" | "email" | "emailVerified">

    return {
      uid: user.uid,
      email: user.email || "",
      displayName: userData.displayName,
      role: userData.role,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || userData.photoURL,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error)
    throw new Error(error.message || "Failed to sign in with Google")
  }
}

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error("Error signing out:", error)
    throw new Error(error.message || "Failed to sign out")
  }
}

// Get current user data
export const getCurrentUserData = async (user: FirebaseUser): Promise<UserData> => {
  try {
    // Get user data from Firestore
    const userRef = doc(db, "users", user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // If user exists in Auth but not in Firestore, create a basic record
      const basicUserData = {
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        role: "student", // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }

      await setDoc(userRef, basicUserData)

      return {
        uid: user.uid,
        email: user.email || "",
        displayName: basicUserData.displayName,
        role: "student",
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      }
    }

    // Update last access timestamp
    await updateDoc(userRef, {
      lastAccess: serverTimestamp(),
    })

    const userData = userDoc.data() as Omit<UserData, "uid" | "email" | "emailVerified">

    return {
      uid: user.uid,
      email: user.email || "",
      displayName: userData.displayName,
      role: userData.role,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || userData.photoURL,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
    }
  } catch (error: any) {
    console.error("Error getting user data:", error)
    throw new Error(error.message || "Failed to get user data")
  }
}

// Update user role
export const updateUserRole = async (uid: string, role: "admin" | "faculty" | "student"): Promise<void> => {
  try {
    await updateDoc(doc(db, "users", uid), { role })
  } catch (error: any) {
    console.error("Error updating user role:", error)
    throw new Error(error.message || "Failed to update user role")
  }
}

// Send verification email
export const sendVerificationEmail = async (user: FirebaseUser): Promise<void> => {
  try {
    await sendEmailVerification(user)
  } catch (error: any) {
    console.error("Error sending verification email:", error)
    throw new Error(error.message || "Failed to send verification email")
  }
}

