import * as React from "react"
import { Users as UsersIcon, ShieldCheck, ShieldAlert } from "lucide-react"
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
import { parseApiError } from "@/utils/parseApiError"
import { toast } from "sonner"

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function Users() {
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)

  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editRole, setEditRole] = React.useState("")
  const [editVenueId, setEditVenueId] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [venues, setVenues] = React.useState<any[]>([])

  React.useEffect(() => {
    adminService.getVenues()
      .then(setVenues)
      .catch(() => { })
  }, [])

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await adminService.getUsers()
      setUsers(Array.isArray(data) ? data : (data as any).users ?? [])
    } catch (error: any) {
      toast.error(parseApiError(error, "Failed to load users"))
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  React.useEffect(() => { fetchUsers() }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const missingDob = users.filter(u => u.role === "customer" && !u.date_of_birth).length
  const missingTerms = users.filter(u => u.role === "customer" && !u.terms_accepted_at).length

  const handleEditClick = (user: any) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setEditVenueId(user.venue_id || "")
    setIsEditOpen(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await adminService.updateUserRole(selectedUser.id, editRole, editVenueId || null)
      toast.success("User role updated successfully")
      setIsEditOpen(false)
      fetchUsers(true)
    } catch (error: any) {
      toast.error(parseApiError(error, "Failed to update user role"))
    } finally {
      setSaving(false)
    }
  }

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "customer", label: "Customer" },
    { value: "bartender", label: "Bartender" },
    { value: "admin", label: "Admin" },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
      </div>

      {(missingDob > 0 || missingTerms > 0) && (
        <div className="flex flex-wrap gap-3">
          {missingDob > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
              <ShieldAlert className="w-4 h-4" />
              {missingDob} customer{missingDob > 1 ? "s" : ""} missing date of birth
            </div>
          )}
          {missingTerms > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
              <ShieldAlert className="w-4 h-4" />
              {missingTerms} customer{missingTerms > 1 ? "s" : ""} missing terms acceptance
            </div>
          )}
        </div>
      )}

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
            filters={[
              {
                id: "role",
                label: "All Roles",
                value: roleFilter,
                onChange: setRoleFilter,
                options: roleOptions,
              }
            ]}
            onRefresh={() => fetchUsers(true)}
            refreshing={refreshing}
          />
          {loading ? (
            <TableSkeletonLoader rows={5} columns={7} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description={searchQuery || roleFilter !== "all" ? "Try adjusting your search or filters" : "No users in the system yet"}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Age / DOB</TableHead>
                    <TableHead>Terms Accepted</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const age = calcAge(user.date_of_birth)
                    const isCustomer = user.role === "customer"
                    const dobMissing = isCustomer && !user.date_of_birth
                    const termsMissing = isCustomer && !user.terms_accepted_at
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : "??"}</AvatarFallback>
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
                            <span>{user.email || "—"}</span>
                            <span className="text-xs text-muted-foreground">{user.phone || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isCustomer ? (
                            dobMissing ? (
                              <span className="text-xs text-amber-500 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Missing
                              </span>
                            ) : (
                              <div className="text-sm">
                                <div className="font-medium">{age} yrs</div>
                                <div className="text-xs text-muted-foreground">{fmtDate(user.date_of_birth)}</div>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isCustomer ? (
                            termsMissing ? (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Not accepted
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 text-sm text-green-600">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-xs">{fmtDate(user.terms_accepted_at)}</span>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(user.created_at)}</TableCell>
                        <TableCell className="text-sm">{user.venue_name || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>Edit Role</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>Change permission level for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 10000 }}>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="bartender">Bartender</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === "bartender" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">Venue</Label>
                <Select value={editVenueId} onValueChange={setEditVenueId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 10000 }}>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
