"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileDown, FileText } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { generateFacultyReport, fetchStudentPerformance, generateStudentReport } from "@/lib/api"

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reportFormat, setReportFormat] = useState("pdf")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true)
        // Get all students with performance data
        const studentData = await fetchStudentPerformance({ limit: 0 }) // No limit to get all students
        setStudents(studentData)

        if (studentData.length > 0) {
          setSelectedStudent(studentData[0].id)
        }
      } catch (error) {
        toast({
          title: "Error loading students",
          description: "Failed to load student data for reports.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStudents()
  }, [toast])

  const handleGenerateFacultyReport = async () => {
    if (!user?.id) return

    try {
      setIsGenerating(true)
      const dateRange = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }

      await generateFacultyReport(user.id, reportFormat, dateRange)

      toast({
        title: "Report generated",
        description: "Your report has been generated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "There was a problem generating your report.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateStudentReport = async () => {
    if (!selectedStudent) {
      toast({
        title: "No student selected",
        description: "Please select a student to generate a report.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      const dateRange = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }

      await generateStudentReport(selectedStudent, reportFormat, dateRange)

      toast({
        title: "Report generated",
        description: "Student report has been generated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "There was a problem generating the student report.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Reports</h1>

        <Tabs defaultValue="faculty">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faculty">My Reports</TabsTrigger>
            <TabsTrigger value="student">Student Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Faculty Attendance Report</CardTitle>
                <CardDescription>Generate reports of all sessions created by you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportFormat">Report Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger id="reportFormat">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Report Details</h3>
                  <p className="text-sm text-muted-foreground">This report includes:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    <li>All attendance sessions you've created</li>
                    <li>Student attendance status for each session</li>
                    <li>Summary statistics for each session</li>
                    <li>Overall attendance verification rate</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGenerateFacultyReport} disabled={isGenerating} className="w-full md:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : `Generate ${reportFormat.toUpperCase()} Report`}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="student" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Attendance Report</CardTitle>
                <CardDescription>Generate reports for individual students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Select Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.studentId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDateStudent">Start Date</Label>
                    <Input
                      id="startDateStudent"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDateStudent">End Date</Label>
                    <Input
                      id="endDateStudent"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportFormatStudent">Report Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger id="reportFormatStudent">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Report Details</h3>
                  <p className="text-sm text-muted-foreground">This report includes:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    <li>Complete attendance history for the selected student</li>
                    <li>Attendance status for each session</li>
                    <li>Summary statistics and attendance percentage</li>
                    <li>Hospital and department details for each session</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleGenerateStudentReport}
                  disabled={isGenerating || !selectedStudent}
                  className="w-full md:w-auto"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : `Generate ${reportFormat.toUpperCase()} Report`}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

