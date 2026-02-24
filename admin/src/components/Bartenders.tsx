import * as React from "react"
import { UserCheck, Plus, Pencil, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

interface Bartender {
  id: string
  name: string
  email: string | null
  phone: string | null
  venue_id: string | null
  venue_name: string | null
  created_at: string
}

interface Venue {
  id: string
  name: string
  location: string
}

export function Bartenders() {
  const [bartenders, setBartenders] = React.useState<Bartender[]>([])
  const [venues, setVenues] = React.useState<Venue[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [venueFilter, setVenueFilter] = React.useState<string>("all")

  // Add Bartender Dialog
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [addName, setAddName] = React.useState("")
  const [addEmail, setAddEmail] = React.useState("")
  const [addPhone, setAddPhone] = React.useState("")
  const [addPassword, setAddPassword] = React.useState("")
  const [addVenueId, setAddVenueId] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)

  // Edit Bartender Dialog
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedBartender, setSelectedBartender] = React.useState<Bartender | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editPhone, setEditPhone] = React.useState("")
  const [editVenueId, setEditVenueId] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)

  // Confirmation dialog
  const { confirm, dialog } = useConfirmDialog()

  const fetchBartenders = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const data = await adminService.getBartenders()
      setBartenders(data.bartenders || [])
    } catch (error: any) {
      console.error("Failed to fetch bartenders", error)
      toast.error("Failed to load bartenders")
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const fetchVenues = async () => {
    try {
      const data = await adminService.getVenues()
      setVenues(data || [])
    } catch (error: any) {
      console.error("Failed to fetch venues", error)
      toast.error("Failed to load venues")
    }
  }

  React.useEffect(() => {
    fetchBartenders()
    fetchVenues()
  }, [])

  const handleAddBartender = async () => {
    if (!addName || !addPassword || !addVenueId) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!addEmail && !addPhone) {
      toast.error("Please provide either email or phone")
      return
    }

    setIsAdding(true)
    try {
      await adminService.createBartender({
        name: addName,
        email: addEmail || null,
        phone: addPhone || null,
        password: addPassword,
        venue_id: addVenueId
      })

      toast.success("Bartender added successfully")
      setIsAddOpen(false)
      resetAddForm()
      fetchBartenders(true)
    } catch (error: any) {
      console.error("Failed to add bartender", error)
      toast.error(error.response?.data?.detail || "Failed to add bartender")
    } finally {
      setIsAdding(false)
    }
  }

  const resetAddForm = () => {
    setAddName("")
    setAddEmail("")
    setAddPhone("")
    setAddPassword("")
    setAddVenueId("")
  }

  const handleEditClick = (bartender: Bartender) => {
    setSelectedBartender(bartender)
    setEditName(bartender.name)
    setEditEmail(bartender.email || "")
    setEditPhone(bartender.phone || "")
    setEditVenueId(bartender.venue_id || "")
    setIsEditOpen(true)
  }

  const handleUpdateBartender = async () => {
    if (!selectedBartender || !editName || !editVenueId) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsEditing(true)
    try {
      await adminService.updateBartender(selectedBartender.id, {
        name: editName,
        email: editEmail || null,
        phone: editPhone || null,
        venue_id: editVenueId
      })

      toast.success("Bartender updated successfully")
      setIsEditOpen(false)
      fetchBartenders(true)
    } catch (error: any) {
      console.error("Failed to update bartender", error)
      toast.error(error.response?.data?.detail || "Failed to update bartender")
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteClick = (bartender: Bartender) => {
    confirm({
      title: "Delete Bartender",
      description: `Are you sure you want to delete ${bartender.name}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await adminService.deleteBartender(bartender.id)
          toast.success("Bartender deleted successfully")
          fetchBartenders(true)
        } catch (error: any) {
          console.error("Failed to delete bartender", error)
          toast.error(error.response?.data?.detail || "Failed to delete bartender")
        }
      }
    })
  }

  // Filter bartenders
  const filteredBartenders = bartenders.filter((bartender) => {
    const matchesSearch =
      bartender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bartender.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bartender.phone?.includes(searchQuery) ||
      bartender.venue_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesVenue = venueFilter === "all" || bartender.venue_id === venueFilter

    return matchesSearch && matchesVenue
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      {dialog}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bartenders</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bartender
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>Manage bartender access and venue assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchPlaceholder="Search bartenders by name, email, phone, or venue..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                id: "venue",
                label: "All Venues",
                value: venueFilter,
                onChange: setVenueFilter,
                options: [
                  { value: "all", label: "All Venues" },
                  ...venues.map(v => ({ value: v.id, label: v.name }))
                ]
              }
            ]}
            onRefresh={() => fetchBartenders(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <TableSkeletonLoader rows={5} columns={4} />
          ) : filteredBartenders.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No bartenders found"
              description={searchQuery || venueFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first bartender"}
              action={!searchQuery && venueFilter === "all" ? {
                label: "Add Bartender",
                onClick: () => setIsAddOpen(true)
              } : undefined}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBartenders.map((bartender) => (
                    <TableRow key={bartender.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {bartender.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{bartender.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{bartender.email || "-"}</span>
                          <span className="text-xs text-muted-foreground">
                            {bartender.phone || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {bartender.venue_name || "No Venue"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(bartender)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(bartender)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bartender Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Bartender</DialogTitle>
            <DialogDescription>
              Create a new bartender account and assign to a venue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="col-span-3"
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="col-span-3"
                placeholder="john@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                className="col-span-3"
                placeholder="+1234567890"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="col-span-3"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="venue" className="text-right">
                Venue *
              </Label>
              <Select value={addVenueId} onValueChange={setAddVenueId}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBartender} disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Bartender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bartender Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bartender</DialogTitle>
            <DialogDescription>
              Update bartender details and venue assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-venue" className="text-right">
                Venue *
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBartender} disabled={isEditing}>
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

