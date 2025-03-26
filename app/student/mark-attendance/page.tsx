"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MapPin, Calendar, Clock, CheckCircle, AlertCircle, Camera } from "lucide-react"
import { fetchHospitals, markAttendanceWithLocation } from "@/lib/api"
import DashboardLayout from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

interface Hospital {
  id: string
  name: string
  departments: string[]
}

export default function MarkAttendancePage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [qrData, setQrData] = useState<string | null>(null)
  const [isScanningQR, setIsScanningQR] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
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

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    setIsLoadingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsLoadingLocation(false)

        toast({
          title: "Location detected",
          description: "Your current location has been detected successfully.",
        })
      },
      (error) => {
        setIsLoadingLocation(false)
        let errorMessage = "Failed to get your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }

        setLocationError(errorMessage)
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive",
        })
      },
    )
  }

  // Handle QR code scanning
  const startQrScanner = () => {
    setIsScanningQR(true)
    // In a real app, implement QR code scanner using a library
    // For this demo, we'll simulate a QR code scan
    setTimeout(() => {
      // Simulated QR code data
      const mockQrData = JSON.stringify({
        sessionId: "mock-session-id",
        hospitalId: hospitals[0]?.id,
        department: hospitals[0]?.departments[0],
        facultyId: "faculty-id",
        timestamp: Date.now(),
      })
      setQrData(mockQrData)
      setIsScanningQR(false)

      toast({
        title: "QR code scanned",
        description: "Successfully scanned attendance QR code.",
      })
    }, 2000)
  }

  // Handle mark attendance submission with location
  const handleMarkAttendance = async () => {
    if (!selectedHospital || !selectedDepartment) {
      toast({
        title: "Missing information",
        description: "Please select hospital and department.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data for API call
      const data: any = {
        sessionId: selectedHospital, // In a real app, this would be the actual session ID
      }

      // Add location data if available
      if (location) {
        data.location = location
      }

      await markAttendanceWithLocation(data)

      setIsSuccess(true)

      toast({
        title: "Attendance marked",
        description: "Your attendance has been submitted successfully with location verification.",
      })
    } catch (error) {
      toast({
        title: "Error marking attendance",
        description: error.message || "There was a problem submitting your attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle QR code attendance submission
  const handleQrAttendance = async () => {
    if (!qrData) {
      toast({
        title: "No QR code scanned",
        description: "Please scan a QR code first.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data for API call
      const data: any = {
        qrData,
      }

      // Add location data if available
      if (location) {
        data.location = location
      }

      await markAttendanceWithLocation(data)

      setIsSuccess(true)

      toast({
        title: "Attendance marked",
        description: "Your attendance has been submitted successfully with QR code verification.",
      })
    } catch (error) {
      toast({
        title: "Error marking attendance",
        description: error.message || "There was a problem submitting your attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Mark Attendance</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading hospital data...</p>
          </div>
        ) : (
          <Tabs defaultValue="qr">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">QR Code Scan</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scan QR Code</CardTitle>
                  <CardDescription>Scan the QR code displayed by your faculty member</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  {!isSuccess ? (
                    <>
                      <div className="w-64 h-64 bg-muted flex items-center justify-center rounded-lg border-2 border-dashed mb-4">
                        {isScanningQR ? (
                          <div className="text-center">
                            <Camera className="h-12 w-12 mb-2 mx-auto animate-pulse text-primary" />
                            <p className="text-muted-foreground">Scanning...</p>
                          </div>
                        ) : qrData ? (
                          <div className="text-center">
                            <CheckCircle className="h-12 w-12 mb-2 mx-auto text-green-500" />
                            <p>QR Code Scanned</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center px-4">
                            {locationError
                              ? "Location error - " + locationError
                              : "Camera access required. Please allow camera permissions when prompted."}
                          </p>
                        )}
                      </div>
                      <div className="space-y-4 w-full">
                        <Button
                          onClick={getCurrentLocation}
                          variant="outline"
                          className="w-full"
                          disabled={isLoadingLocation || !!location}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {isLoadingLocation
                            ? "Detecting Location..."
                            : location
                              ? "Location Detected"
                              : "Verify Location"}
                        </Button>

                        {location && (
                          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <AlertTitle>Location Verified</AlertTitle>
                            <AlertDescription>Your location has been successfully verified.</AlertDescription>
                          </Alert>
                        )}

                        {locationError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Location Error</AlertTitle>
                            <AlertDescription>{locationError}</AlertDescription>
                          </Alert>
                        )}

                        <Button
                          onClick={qrData ? handleQrAttendance : startQrScanner}
                          className="w-full"
                          disabled={isSubmitting || (qrData && !location)}
                        >
                          {isSubmitting ? "Submitting..." : qrData ? "Submit Attendance" : "Start Scanning"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">Attendance Submitted!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your attendance has been submitted and is pending faculty verification.
                      </p>
                      <Button
                        onClick={() => {
                          setIsSuccess(false)
                          setQrData(null)
                          setLocation(null)
                        }}
                      >
                        Mark Another Attendance
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              {isSuccess ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Submitted</CardTitle>
                    <CardDescription>Your attendance has been recorded successfully</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Thank You!</h3>
                    <p className="text-center text-muted-foreground mb-4">
                      Your attendance has been submitted and is pending faculty verification.
                    </p>
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
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p>{new Date().toLocaleTimeString()}</p>
                      </div>
                      {location && (
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <p className="text-green-600">Location verified</p>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setIsSuccess(false)
                        setLocation(null)
                      }}
                    >
                      Mark Another Attendance
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Attendance</CardTitle>
                    <CardDescription>Select your current hospital and department</CardDescription>
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

                    <Button
                      onClick={getCurrentLocation}
                      variant="outline"
                      className="w-full"
                      disabled={isLoadingLocation || !!location}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {isLoadingLocation ? "Detecting Location..." : location ? "Location Detected" : "Verify Location"}
                    </Button>

                    {location && (
                      <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Location Verified</AlertTitle>
                        <AlertDescription>Your location has been successfully verified.</AlertDescription>
                      </Alert>
                    )}

                    {locationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Location Error</AlertTitle>
                        <AlertDescription>{locationError}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={handleMarkAttendance}
                      disabled={isSubmitting || !selectedHospital || !selectedDepartment || !location}
                    >
                      {isSubmitting ? "Submitting..." : "Mark Attendance"}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}

