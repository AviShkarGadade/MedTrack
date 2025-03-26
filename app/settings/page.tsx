"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    sessionReminders: true,
    attendanceVerifications: true,
    monthlyReports: true,
  })

  const [privacySettings, setPrivacySettings] = useState({
    shareAttendanceWithFaculty: true,
    allowLocationTracking: true,
    showProfileToOthers: true,
  })

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({
      title: "Theme Updated",
      description: `Theme has been changed to ${newTheme}.`,
    })
  }

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))

    toast({
      title: "Settings Updated",
      description: "Your notification settings have been saved.",
    })
  }

  const handlePrivacyChange = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))

    toast({
      title: "Settings Updated",
      description: "Your privacy settings have been saved.",
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="appearance">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how MedTrack looks and feels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex space-x-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange("light")}
                    >
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                    >
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => handleThemeChange("system")}
                    >
                      System
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Choose between light, dark, or system theme.</p>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Theme changes are saved automatically.</p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationChange("emailNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="session-reminders">Session Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminders about upcoming sessions.</p>
                  </div>
                  <Switch
                    id="session-reminders"
                    checked={notificationSettings.sessionReminders}
                    onCheckedChange={() => handleNotificationChange("sessionReminders")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="attendance-verifications">Attendance Verifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when your attendance is verified.
                    </p>
                  </div>
                  <Switch
                    id="attendance-verifications"
                    checked={notificationSettings.attendanceVerifications}
                    onCheckedChange={() => handleNotificationChange("attendanceVerifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monthly-reports">Monthly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive monthly attendance reports.</p>
                  </div>
                  <Switch
                    id="monthly-reports"
                    checked={notificationSettings.monthlyReports}
                    onCheckedChange={() => handleNotificationChange("monthlyReports")}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Notification settings are saved automatically.</p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Manage your privacy settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share-attendance">Share Attendance with Faculty</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow faculty members to view your attendance details.
                    </p>
                  </div>
                  <Switch
                    id="share-attendance"
                    checked={privacySettings.shareAttendanceWithFaculty}
                    onCheckedChange={() => handlePrivacyChange("shareAttendanceWithFaculty")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="location-tracking">Allow Location Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the app to verify your location when marking attendance.
                    </p>
                  </div>
                  <Switch
                    id="location-tracking"
                    checked={privacySettings.allowLocationTracking}
                    onCheckedChange={() => handlePrivacyChange("allowLocationTracking")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-profile">Show Profile to Others</Label>
                    <p className="text-sm text-muted-foreground">Allow other users to see your profile information.</p>
                  </div>
                  <Switch
                    id="show-profile"
                    checked={privacySettings.showProfileToOthers}
                    onCheckedChange={() => handlePrivacyChange("showProfileToOthers")}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Privacy settings are saved automatically.</p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

