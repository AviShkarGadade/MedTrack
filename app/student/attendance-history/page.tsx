"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckCircle2, XCircle, Clock, MapPin, CalendarIcon, Download, Filter, Search } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { fetchStudentAttendance, generateStudentReport } from "@/lib/api"
import DashboardLayout from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

interface Attendance {
  id: string
  date: string
  hospital: string
  department: string
  status: "present" | "absent" | "pending"
  verifiedBy?: string
}

export default function AttendanceHistoryPage() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [hospitalFilter, setHospitalFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportFormat, setReportFormat] = useState("pdf")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const attendanceData = await fetchStudentAttendance()
        setAttendance(attendanceData)
        setFilteredAttendance(attendanceData)
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "There was a problem loading your attendance history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Get unique hospitals for filter
  const hospitals = Array.from(new Set(attendance.map((item) => item.hospital)))

  // Apply filters
  useEffect(() => {
    let filtered = [...attendance]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.hospital.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          (item.verifiedBy && item.verifiedBy.toLowerCase().includes(query)),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Apply hospital filter
    if (hospitalFilter !== "all") {
      filtered = filtered.filter((item) => item.hospital === hospitalFilter)
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter((item) => new Date(item.date) >= dateRange.from!)
    }

    if (dateRange.to) {
      filtered = filtered.filter((item) => new Date(item.date) <= dateRange.to!)
    }

    setFilteredAttendance(filtered)
  }, [attendance, searchQuery, statusFilter, hospitalFilter, dateRange])

  const handleGenerateReport = async () => {
    if (!user?.id) return

    try {
      setIsGeneratingReport(true)

      const dateRangeParams = {
        ...(dateRange.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange.to && { endDate: dateRange.to.toISOString() }),
      }

      await generateStudentReport(user.id, reportFormat, dateRangeParams)

      toast({
        title: "Report generated",
        description: `Your attendance report has been generated in ${reportFormat.toUpperCase()} format.`,
      })
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "There was a problem generating your report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setHospitalFilter("all")
    setDateRange({ from: undefined, to: undefined })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Attendance History</h1>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={reportFormat} onValueChange={setReportFormat}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleGenerateReport} disabled={isGeneratingReport} className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingReport ? "Generating..." : "Export Report"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading your attendance history...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital</Label>
                    <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                      <SelectTrigger id="hospital">
                        <SelectValue placeholder="Filter by hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Hospitals</SelectItem>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital} value={hospital}>
                            {hospital}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && !dateRange.to && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            "Select date range"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={clearFilters} className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attendance List */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  Showing {filteredAttendance.length} of {attendance.length} records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAttendance.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-4 font-medium border-b">
                      <div className="col-span-2">Date & Department</div>
                      <div className="hidden md:block">Hospital</div>
                      <div className="hidden md:block">Verified By</div>
                      <div className="text-right">Status</div>
                    </div>
                    <div className="divide-y">
                      {filteredAttendance.map((item) => (
                        <div key={item.id} className="grid grid-cols-5 p-4 items-center">
                          <div className="col-span-2">
                            <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">{item.department}</p>
                          </div>
                          <div className="hidden md:block text-sm">
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                              {item.hospital}
                            </div>
                          </div>
                          <div className="hidden md:block text-sm text-muted-foreground">
                            {item.verifiedBy || "Not verified yet"}
                          </div>
                          <div className="flex justify-end">
                            <Badge
                              variant={
                                item.status === "present"
                                  ? "default"
                                  : item.status === "absent"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="flex items-center"
                            >
                              {item.status === "present" ? (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              ) : item.status === "absent" ? (
                                <XCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <Clock className="mr-1 h-3 w-3" />
                              )}
                              {item.status === "present" ? "Present" : item.status === "absent" ? "Absent" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-muted-foreground">No attendance records found matching your filters.</p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

