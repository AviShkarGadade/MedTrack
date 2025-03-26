"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { api } from "@/lib/api"

interface DashboardStats {
  totalSessions: number
  totalAttendance: number
  verificationRate: string
  upcomingSessions: number
}

interface RecentSession {
  _id: string
  title: string
  startTime: string
  endTime: string
  hospital: {
    name: string
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalAttendance: 0,
    verificationRate: "0",
    upcomingSessions: 0,
  })
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // This would be replaced with actual API calls
        const statsData = await api.get("/analytics/dashboard")
        const sessionsData = await api.get("/sessions/recent")

        setStats({
          totalSessions: statsData.data.counts.sessionCount || 0,
          totalAttendance: statsData.data.counts.attendanceCount || 0,
          verificationRate: statsData.data.counts.verificationRate || "0",
          upcomingSessions: 3, // Example value
        })

        setRecentSessions(sessionsData.data || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="stats-card bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <h3 className="text-2xl font-bold">{stats.totalSessions}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Attendance</p>
                  <h3 className="text-2xl font-bold">{stats.totalAttendance}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verification Rate</p>
                  <h3 className="text-2xl font-bold">{stats.verificationRate}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Sessions</p>
                  <h3 className="text-2xl font-bold">{stats.upcomingSessions}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="recent">Recent Sessions</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <p>Loading recent sessions...</p>
                </div>
              ) : recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <Card key={session._id} className="attendance-card bg-card text-card-foreground">
                    <CardHeader className="pb-2">
                      <CardTitle>{session.title}</CardTitle>
                      <CardDescription>{session.hospital.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Date</p>
                          <p>{formatDate(session.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Time</p>
                          <p>
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card text-card-foreground">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No recent sessions found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              <Card className="bg-card text-card-foreground">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No upcoming sessions found</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

