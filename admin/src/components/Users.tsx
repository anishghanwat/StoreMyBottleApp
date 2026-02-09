import * as React from "react"
import { Search, MoreHorizontal, User } from "lucide-react"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const usersData = [
  { id: "U1001", name: "Alice Johnson", email: "alice@example.com", phone: "+1 555-0101", role: "Customer", purchases: 12 },
  { id: "U1002", name: "Bob Smith", email: "bob@example.com", phone: "+1 555-0102", role: "Bartender", purchases: 0 },
  { id: "U1003", name: "Charlie Davis", email: "charlie@example.com", phone: "+1 555-0103", role: "Customer", purchases: 5 },
  { id: "U1004", name: "Dana Wilson", email: "dana@example.com", phone: "+1 555-0104", role: "Admin", purchases: 2 },
  { id: "U1005", name: "Evan Brown", email: "evan@example.com", phone: "+1 555-0105", role: "Customer", purchases: 24 },
]

import { adminService } from "@/services/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function Users() {
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)

  // Edit State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editRole, setEditRole] = React.useState("")
  const [editVenueId, setEditVenueId] = React.useState("")
  const [venues, setVenues] = React.useState<any[]>([])

  // Fetch venues on mount
  React.useEffect(() => {
    const loadVenues = async () => {
      try {
        const data = await adminService.getVenues()
        setVenues(data)
      } catch (error) {
        console.error("Failed to fetch venues", error)
      }
    }
    loadVenues()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await adminService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users", error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const handleEditClick = (user: any) => {
    console.log("handleEditClick called for:", user)
    setSelectedUser(user)
    setEditRole(user.role)
    setEditVenueId(user.venue_id || "")
    setIsEditOpen(true)
    console.log("setIsEditOpen called. New state should be true.")
  }

  const handleSaveRole = async () => {
    console.log("handleSaveRole called")
    if (!selectedUser) return
    try {
      await adminService.updateUserRole(selectedUser.id, editRole, editVenueId || null)
      setIsEditOpen(false)
      fetchUsers() // Refresh list
    } catch (error) {
      console.error("Failed to update role", error)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-0 relative min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage customers, bartenders, and admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
              />
            </div>
            <div className="ml-auto">
              <Button variant="outline" onClick={fetchUsers}>Refresh</Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Venue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "destructive" : user.role === "bartender" ? "secondary" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{user.email}</span>
                        <span className="text-xs text-muted-foreground">{user.phone || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{user.venue_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                        Edit Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change permission level for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="bartender">Bartender</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === 'bartender' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">
                  Venue
                </Label>
                <Select value={editVenueId} onValueChange={setEditVenueId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveRole}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
