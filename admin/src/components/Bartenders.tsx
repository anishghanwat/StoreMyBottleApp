import * as React from "react"
import { Search, MoreHorizontal, UserCheck } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const bartendersData = [
  { id: 1, name: "Bob Smith", venue: "Sky Bar", status: "Active", lastActive: "2 mins ago" },
  { id: 2, name: "Sarah Jones", venue: "Ocean Club", status: "Active", lastActive: "1 hour ago" },
  { id: 3, name: "Mike Taylor", venue: "High Spirits", status: "Offline", lastActive: "2 days ago" },
  { id: 4, name: "Jessica White", venue: "The Vault", status: "Active", lastActive: "Just now" },
]

export function Bartenders() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bartenders</h2>
        <Button>
            <UserCheck className="mr-2 h-4 w-4" />
            Add Bartender
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>Manage bartender access and venues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bartenders..."
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bartendersData.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{staff.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{staff.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>{staff.venue}</TableCell>
                    <TableCell>
                      <Badge variant={staff.status === "Active" ? "default" : "secondary"}>
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{staff.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Reassign Venue</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Revoke Access</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
