"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Download } from "lucide-react"
import { LineChart } from "@/components/charts"

export default function StudentAttendancePage() {
  const [month, setMonth] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const attendanceRecords = [
    {
      id: 1,
      session: "Cardiology Rotation",
      date: "2025-03-22",
      time: "09:00 AM - 12:00 PM",
      hospital: "City General Hospital",
      faculty: "Dr. Smith",
      status: "present",
    },
    {
      id: 2,
      session: "Neurology Examination",
      date: "2025-03-18",
      time: "10:30 AM - 01:30 PM",
      hospital: "University Medical Center",
      faculty: "Dr. Johnson",
      status: "present",
    },
    {
      id: 3,
      session: "Pediatrics Rounds",
      date: "2025-03-15",
      time: "08:00 AM - 11:00 AM",
      hospital: "Children's Hospital",
      faculty: "Dr. Williams",
      status: "absent",
    },
    {
      id: 4,
      session: "Emergency Medicine",
      date: "2025-03-10",
      time: "02:00 PM - 05:00 PM",
      hospital: "City General Hospital",
      faculty: "Dr. Brown",
      status: "present",
    },
    {
      id: 5,
      session: "Orthopedics Clinic",
      date: "2025-03-05",
      time: "09:30 AM - 12:30 PM",
      hospital: "University Medical Center",
      faculty: "Dr. Davis",
      status: "present",
    },
  ]

  const filteredRecords = attendanceRecords.filter(
    (record) =>
      record.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.faculty.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Attendance History</h1>
              <p className="text-muted-foreground">View and track your attendance records</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
              <Download className="mr-2 h-4 w-4" />
              Export Records
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Your attendance statistics over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <LineChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Detailed list of your attendance for all sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-[180px]">
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="jan">January</SelectItem>
                      <SelectItem value="feb">February</SelectItem>
                      <SelectItem value="mar">March</SelectItem>
                      <SelectItem value="apr">April</SelectItem>
                      <SelectItem value="may">May</SelectItem>
                      <SelectItem value="jun">June</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden md:table-cell">Time</TableHead>
                      <TableHead className="hidden md:table-cell">Hospital</TableHead>
                      <TableHead className="hidden md:table-cell">Faculty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.session}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell className="hidden md:table-cell">{record.time}</TableCell>
                          <TableCell className="hidden md:table-cell">{record.hospital}</TableCell>
                          <TableCell className="hidden md:table-cell">{record.faculty}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === "present" ? "default" : "destructive"}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

