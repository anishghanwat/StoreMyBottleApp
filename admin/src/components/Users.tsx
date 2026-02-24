import * as React from "react"
import { Users as UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { adminService } from "@/services/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"
import { toast } from "sonner"

export function Users() {
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
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

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const data = await adminService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users", error)
      toast.error("Failed to load users")
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleEditClick = (user: any) => {
    console.log("handleEditClick called for:", user)
    setSelectedUser(user)
    setEditRole(user.role)
    setEditVenueId(user.venue_id || "")
    setIsEditOpen(true)
    console.log("setIsEditOpen called. New state should be true.")
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return
    try {
      await adminService.updateUserRole(selectedUser.id, editRole, editVenueId || null)
      toast.success("User role updated successfully")
      setIsEditOpen(false)
      fetchUsers(true) // Silent refresh
    } catch (error) {
      console.error("Failed to update role", error)
      toast.error("Failed to update user role")
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage customers, bartenders, and admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchPlaceholder="Search users by name, email, phone, or role..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={() => fetchUsers(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <TableSkeletonLoader rows={5} columns={5} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description={searchQuery
                ? "Try adjusting your search query"
                : "No users in the system yet"}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
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
                  {filteredUsers.map((user) => (
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
                </TableBody>
              </Table>
            </div>
          )}
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
