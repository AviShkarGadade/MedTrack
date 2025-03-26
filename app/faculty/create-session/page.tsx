"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createAttendanceSession, fetchHospitals } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface Hospital {
  _id: string
  name: string
  departments: { _id: string; name: string }[]
}

export default function CreateSessionPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [hospitalId, setHospitalId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [duration, setDuration] = useState("60")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingHospitals, setFetchingHospitals] = useState(true)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const getHospitals = async () => {
      try {
        const data = await fetchHospitals()
        setHospitals(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch hospitals. Please try again.",
          variant: "destructive",
        })
      } finally {
        setFetchingHospitals(false)
      }
    }

    getHospitals()
  }, [toast])

  useEffect(() => {
    if (hospitalId) {
      const selectedHospital = hospitals.find((h) => h._id === hospitalId)
      setDepartments(selectedHospital?.departments || [])
      setDepartmentId("") // Reset department selection when hospital changes
    } else {
      setDepartments([])
    }
  }, [hospitalId, hospitals])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !hospitalId || !departmentId || !duration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const sessionData = {
        title,
        description,
        hospitalId,
        departmentId,
        duration: Number.parseInt(duration),
      }

      await createAttendanceSession(sessionData)

      toast({
        title: "Success",
        description: "Attendance session created successfully",
      })

      router.push("/faculty/dashboard")
    } catch (error) {
      console.error("Session creation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create attendance session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Attendance Session</CardTitle>
          <CardDescription>Create a new attendance session for students to join</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                placeholder="Enter session title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter session description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital</Label>
              {fetchingHospitals ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading hospitals...</span>
                </div>
              ) : (
                <Select value={hospitalId} onValueChange={setHospitalId}>
                  <SelectTrigger id="hospital">
                    <SelectValue placeholder="Select a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={!hospitalId || departments.length === 0}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder={!hospitalId ? "Select a hospital first" : "Select a department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department._id} value={department._id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

