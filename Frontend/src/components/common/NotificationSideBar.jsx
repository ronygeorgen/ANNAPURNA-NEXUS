import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Bell } from "lucide-react"
import { useSelector } from 'react-redux'

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function NotificationSideBar() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [ws, setWs] = useState(null)
  const userId = useSelector(state => state.auth.user?.id)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket(`ws://localhost:8004/ws/notifications/${userId}/`)
      
      websocket.onopen = () => {
        console.log('Connected to notifications websocket')
      }

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('Received WebSocket message:', data)

        if (data.type === 'past_notifications' && Array.isArray(data.messages)) {
          setNotifications(data.messages)
          setUnreadCount(data.messages.filter(msg => !msg.is_read).length)
        } else if (data.type === 'notification') {
          setNotifications(prev => [data.message, ...prev])
          if (!isSheetOpen) {
            setUnreadCount(prev => prev + 1)
          }
        } else if (data.type === 'notifications_read') {
          setNotifications(prev => 
            prev.map(notification => ({
              ...notification,
              is_read: true
            }))
          )
          setUnreadCount(0)
        }
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      websocket.onclose = () => {
        console.log('Disconnected from notifications websocket')
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000)
      }

      setWs(websocket)

      return websocket
    }

    const websocket = connectWebSocket()

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [userId])

  const handleSheetOpenChange = (open) => {
    setIsSheetOpen(open)
    if (open && ws && ws.readyState === WebSocket.OPEN) {
      // Send message to mark notifications as read
      ws.send(JSON.stringify({ type: 'make_read' }))
      setUnreadCount(0)
    }
  }

  const handleViewOrder = (orderId) => {
    // Implement order navigation logic
    console.log(`Navigate to order ${orderId}`)
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <button className="relative text-gray-600 hover:text-orange-500 transition-colors duration-200">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Your latest updates and notifications
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={notification.id || index}
                className={`rounded-lg p-4 transition-colors ${
                  notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                } hover:bg-gray-100`}
              >
                <p className="text-sm text-gray-800">{notification.message}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.created_at)}
                  </span>
                  {notification.order_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(notification.order_id)}
                    >
                      View Order
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}