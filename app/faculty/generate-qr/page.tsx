"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, Clock, Download, Share2 } from "lucide-react"
import { fetchHospitals } from "@/lib/api"
import DashboardLayout from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

interface Hospital {
  id: string
  name: string
  departments: string[]
}

export default function GenerateQRPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [sessionDuration, setSessionDuration] = useState<string>("60")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrGenerated, setQrGenerated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const hospitalsData = await fetchHospitals()

        setHospitals(hospitalsData)

        if (hospitalsData.length > 0) {
          setSelectedHospital(hospitalsData[0].id)
          if (hospitalsData[0].departments.length > 0) {
            setSelectedDepartment(hospitalsData[0].departments[0])
          }
        }
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "There was a problem loading hospital data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Filter departments based on selected hospital
  const departments = hospitals.find((h) => h.id === selectedHospital)?.departments || []

  // Handle hospital change
  const handleHospitalChange = (value: string) => {
    setSelectedHospital(value)
    const hospital = hospitals.find((h) => h.id === value)
    if (hospital && hospital.departments.length > 0) {
      setSelectedDepartment(hospital.departments[0])
    } else {
      setSelectedDepartment("")
    }
  }

  // Handle QR code generation
  const handleGenerateQR = async () => {
    if (!selectedHospital || !selectedDepartment) {
      toast({
        title: "Missing information",
        description: "Please select hospital and department.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setQrGenerated(true)

      toast({
        title: "QR code generated",
        description: "QR code has been generated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error generating QR code",
        description: "There was a problem generating the QR code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Generate Attendance QR</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading hospital data...</p>
          </div>
        ) : (
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate QR</TabsTrigger>
              <TabsTrigger value="active">Active Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-4">
              {qrGenerated ? (
                <Card>
                  <CardHeader>
                    <CardTitle>QR Code Generated</CardTitle>
                    <CardDescription>Show this QR code to students for attendance</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="w-64 h-64 bg-white flex items-center justify-center rounded-lg border mb-4">
                      {/* Placeholder for QR code */}
                      <div className="w-48 h-48 bg-gray-800 rounded-lg"></div>
                    </div>
                    <div className="w-full max-w-md rounded-lg border p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p>
                          {hospitals.find((h) => h.id === selectedHospital)?.name} - {selectedDepartment}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p>Valid for {sessionDuration} minutes</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => setQrGenerated(false)}>
                      Generate New QR Code
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Generate QR Code</CardTitle>
                    <CardDescription>Create a QR code for student attendance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hospital">Hospital</Label>
                      <Select value={selectedHospital} onValueChange={handleHospitalChange}>
                        <SelectTrigger id="hospital">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={hospital.id}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={selectedDepartment}
                        onValueChange={setSelectedDepartment}
                        disabled={departments.length === 0}
                      >
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Session Duration (minutes)</Label>
                      <Select value={sessionDuration} onValueChange={setSessionDuration}>
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>Date: {new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p>Time: {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={handleGenerateQR}
                      disabled={isGenerating || !selectedHospital || !selectedDepartment}
                    >
                      {isGenerating ? "Generating..." : "Generate QR Code"}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active QR Sessions</CardTitle>
                  <CardDescription>Currently active attendance sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <div className="p-4 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="font-medium">City General Hospital - Cardiology</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-lg border">
                          {/* Small QR code preview */}
                          <div className="w-12 h-12 bg-gray-800 rounded-lg"></div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expires in: 45 minutes</p>
                          <p className="text-sm text-muted-foreground">5 students checked in</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="destructive" size="sm">
                          End Session
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}

