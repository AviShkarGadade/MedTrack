"use client"

import { useState } from "react"
import { useNotifications } from "@/components/notification-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { Check } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()
  const [activeTab, setActiveTab] = useState("all")

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.isRead)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>View and manage your notifications</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={!notifications.some((n) => !n.isRead)}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <p>Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No {activeTab !== "all" ? activeTab : ""} notifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`rounded-lg border p-4 ${!notification.isRead ? "bg-muted/50" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <h3 className="font-medium">{notification.title}</h3>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                          <div className="mt-3 flex gap-2">
                            {notification.link && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                onClick={() => !notification.isRead && markAsRead(notification._id)}
                              >
                                <Link href={notification.link}>View Details</Link>
                              </Button>
                            )}
                            {!notification.isRead && (
                              <Button variant="ghost" size="sm" onClick={() => markAsRead(notification._id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

