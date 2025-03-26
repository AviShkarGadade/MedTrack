"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { Download, Calendar } from "lucide-react"

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month")

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">Comprehensive analytics and reports for the entire system</p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="attendance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="faculty">Faculty</TabsTrigger>
              <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Attendance Rate</CardTitle>
                    <CardDescription>Average attendance rate across all sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">87%</div>
                    <p className="text-sm text-muted-foreground">+2% from previous {timeRange}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Sessions</CardTitle>
                    <CardDescription>Number of sessions conducted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">248</div>
                    <p className="text-sm text-muted-foreground">+18 from previous {timeRange}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Entries</CardTitle>
                    <CardDescription>Total number of attendance records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">3,542</div>
                    <p className="text-sm text-muted-foreground">+215 from previous {timeRange}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Attendance rate over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart />
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance by Department</CardTitle>
                    <CardDescription>Attendance distribution across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PieChart />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance by Hospital</CardTitle>
                    <CardDescription>Attendance distribution across hospitals</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <BarChart />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Analytics</CardTitle>
                  <CardDescription>Detailed analytics about student performance and attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Student analytics content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faculty" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Faculty Analytics</CardTitle>
                  <CardDescription>Detailed analytics about faculty performance and sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Faculty analytics content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hospitals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hospital Analytics</CardTitle>
                  <CardDescription>Detailed analytics about hospital utilization and sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Hospital analytics content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

