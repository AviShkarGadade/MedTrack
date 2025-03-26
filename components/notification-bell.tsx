"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "./notification-provider"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()

  const handleNotificationClick = async (id: string, link?: string) => {
    await markAsRead(id)
    if (link) {
      // Navigate to the link
      window.location.href = link
    }
    setOpen(false)
  }

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                  Mark all as read
                </Button>
              )}
            </div>
            <CardDescription>
              {loading
                ? "Loading notifications..."
                : unreadCount > 0
                  ? `You have ${unreadCount} unread notifications`
                  : "No new notifications"}
            </CardDescription>
          </CardHeader>
          <Separator />
          <ScrollArea className="h-[300px]">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <ul className="divide-y">
                  {notifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`p-3 hover:bg-muted cursor-pointer ${!notification.isRead ? "bg-muted/50" : ""}`}
                      onClick={() => handleNotificationClick(notification._id, notification.link)}
                    >
                      <div className="flex gap-2">
                        <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium leading-none">{notification.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardFooter className="p-2">
            <Link
              href="/notifications"
              className="text-xs text-center w-full text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

