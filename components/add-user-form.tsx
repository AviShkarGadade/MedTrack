"use client"

import type React from "react"

import { useState } from "react"
import { registerUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface AddUserFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [studentId, setStudentId] = useState("")
  const [facultyId, setFacultyId] = useState("")
  const [batch, setBatch] = useState("")
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password || !role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Role-specific validation
    if (role === "student" && !studentId) {
      toast({
        title: "Validation Error",
        description: "Student ID is required for student accounts",
        variant: "destructive",
      })
      return
    }

    if (role === "faculty" && !facultyId) {
      toast({
        title: "Validation Error",
        description: "Faculty ID is required for faculty accounts",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const userData = {
        name,
        email,
        password,
        role,
        ...(role === "student" && { studentId, batch }),
        ...(role === "faculty" && { facultyId }),
      }

      await registerUser(userData)

      toast({
        title: "Success",
        description: "User created successfully",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {role === "student" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              placeholder="Enter student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Input
              id="batch"
              placeholder="Enter batch (e.g., 2023)"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
            />
          </div>
        </div>
      )}

      {role === "faculty" && (
        <div className="space-y-2">
          <Label htmlFor="facultyId">Faculty ID</Label>
          <Input
            id="facultyId"
            placeholder="Enter faculty ID"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            required
          />
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create User"
          )}
        </Button>
      </div>
    </form>
  )
}

