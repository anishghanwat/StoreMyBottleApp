import * as React from "react"
import { MoreHorizontal, Search, MessageSquare, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const ticketsData = [
  {
    id: "TKT-2491",
    user: {
      name: "Alice Johnson",
      email: "alice@example.com",
      image: "https://i.pravatar.cc/150?u=alice",
    },
    subject: "Cannot redeem bottle at Sky Bar",
    priority: "High",
    status: "Open",
    created: "2 hours ago",
    lastUpdate: "10 mins ago",
  },
  {
    id: "TKT-2490",
    user: {
      name: "Bob Smith",
      email: "bob@example.com",
      image: "https://i.pravatar.cc/150?u=bob",
    },
    subject: "Charged twice for the same transaction",
    priority: "Critical",
    status: "In Progress",
    created: "5 hours ago",
    lastUpdate: "1 hour ago",
  },
  {
    id: "TKT-2489",
    user: {
      name: "Charlie Davis",
      email: "charlie@example.com",
      image: "https://i.pravatar.cc/150?u=charlie",
    },
    subject: "App crashes when scanning QR code",
    priority: "Medium",
    status: "Open",
    created: "1 day ago",
    lastUpdate: "1 day ago",
  },
  {
    id: "TKT-2488",
    user: {
      name: "David Wilson",
      email: "david@example.com",
      image: "https://i.pravatar.cc/150?u=david",
    },
    subject: "Change phone number request",
    priority: "Low",
    status: "Resolved",
    created: "2 days ago",
    lastUpdate: "1 day ago",
  },
  {
    id: "TKT-2487",
    user: {
      name: "Eva Green",
      email: "eva@example.com",
      image: "https://i.pravatar.cc/150?u=eva",
    },
    subject: "Question about Happy Hour timings",
    priority: "Low",
    status: "Closed",
    created: "3 days ago",
    lastUpdate: "2 days ago",
  },
]

export function SupportTickets() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-muted-foreground">
            Manage customer issues and helpdesk requests.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Good job team!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">-15% from last week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tickets..." className="pl-8 w-[250px]" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsData.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono font-medium">{ticket.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.user.image} alt={ticket.user.name} />
                        <AvatarFallback>{ticket.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{ticket.user.name}</span>
                        <span className="text-xs text-muted-foreground">{ticket.user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={ticket.subject}>
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.priority === "Critical" ? "destructive" : ticket.priority === "High" ? "outline" : "secondary"} className={ticket.priority === "High" ? "border-orange-500 text-orange-500" : ""}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === "Open" ? "default" : ticket.status === "Resolved" || ticket.status === "Closed" ? "secondary" : "outline"} className={ticket.status === "Open" ? "bg-blue-500 hover:bg-blue-600" : ""}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ticket.created}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Assign to me</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
