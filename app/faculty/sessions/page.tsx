"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Trash2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FacultySessionsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    hospital: "",
    department: "",
    description: "",
  })

  const sessions = [
    {
      id: 1,
      title: "Cardiology Rotation",
      date: "2025-03-26",
      time: "09:00 AM - 12:00 PM",
      hospital: "City General Hospital",
      department: "Cardiology",
      students: 12,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Neurology Examination",
      date: "2025-03-28",
      time: "10:30 AM - 01:30 PM",
      hospital: "University Medical Center",
      department: "Neurology",
      students: 8,
      status: "upcoming",
    },
    {
      id: 3,
      title: "Pediatrics Rounds",
      date: "2025-03-15",
      time: "08:00 AM - 11:00 AM",
      hospital: "Children's Hospital",
      department: "Pediatrics",
      students: 10,
      status: "completed",
    },
    {
      id: 4,
      title: "Emergency Medicine",
      date: "2025-03-10",
      time: "02:00 PM - 05:00 PM",
      hospital: "City General Hospital",
      department: "Emergency",
      students: 15,
      status: "completed",
    },
    {
      id: 5,
      title: "Orthopedics Clinic",
      date: "2025-03-05",
      time: "09:30 AM - 12:30 PM",
      hospital: "University Medical Center",
      department: "Orthopedics",
      students: 6,
      status: "completed",
    },
  ]

  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const upcomingSessions = filteredSessions.filter((session) => session.status === "upcoming")
  const completedSessions = filteredSessions.filter((session) => session.status === "completed")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call an API to create a new session
    toast({
      title: "Session created",
      description: "Your new session has been scheduled successfully.",
    })
    setShowDialog(false)
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      hospital: "",
      department: "",
      description: "",
    })
  }

  return (
    <ProtectedRoute allowedRoles={["faculty"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
              <p className="text-muted-foreground">Manage your clinical sessions and rotations</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="mt-2 sm:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                  <DialogDescription>Fill in the details to schedule a new clinical session</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">
                        Date
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startTime" className="text-right">
                        Start Time
                      </Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endTime" className="text-right">
                        End Time
                      </Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="hospital" className="text-right">
                        Hospital
                      </Label>
                      <Select
                        value={formData.hospital}
                        onValueChange={(value) => handleSelectChange("hospital", value)}
                      >
                        <SelectTrigger id="hospital" className="col-span-3">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city-general">City General Hospital</SelectItem>
                          <SelectItem value="university-medical">University Medical Center</SelectItem>
                          <SelectItem value="childrens">Children's Hospital</SelectItem>
                          <SelectItem value="memorial">Memorial Hospital</SelectItem>
                          <SelectItem value="community">Community Medical Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="department" className="text-right">
                        Department
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => handleSelectChange("department", value)}
                      >
                        <SelectTrigger id="department" className="col-span-3">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cardiology">Cardiology</SelectItem>
                          <SelectItem value="neurology">Neurology</SelectItem>
                          <SelectItem value="pediatrics">Pediatrics</SelectItem>
                          <SelectItem value="orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="emergency">Emergency Medicine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Session</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-8 mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
              <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>Sessions that are scheduled for the future</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="hidden md:table-cell">Time</TableHead>
                          <TableHead className="hidden md:table-cell">Hospital</TableHead>
                          <TableHead className="hidden md:table-cell">Department</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingSessions.length > 0 ? (
                          upcomingSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.title}</TableCell>
                              <TableCell>{session.date}</TableCell>
                              <TableCell className="hidden md:table-cell">{session.time}</TableCell>
                              <TableCell className="hidden md:table-cell">{session.hospital}</TableCell>
                              <TableCell className="hidden md:table-cell">{session.department}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Users className="mr-1 h-4 w-4" />
                                  {session.students}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No upcoming sessions found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Sessions</CardTitle>
                  <CardDescription>Sessions that have already taken place</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="hidden md:table-cell">Time</TableHead>
                          <TableHead className="hidden md:table-cell">Hospital</TableHead>
                          <TableHead className="hidden md:table-cell">Department</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedSessions.length > 0 ? (
                          completedSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.title}</TableCell>
                              <TableCell>{session.date}</TableCell>
                              <TableCell className="hidden md:table-cell">{session.time}</TableCell>
                              <TableCell className="hidden md:table-cell">{session.hospital}</TableCell>
                              <TableCell className="hidden md:table-cell">{session.department}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Users className="mr-1 h-4 w-4" />
                                  {session.students}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  View Report
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No completed sessions found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

