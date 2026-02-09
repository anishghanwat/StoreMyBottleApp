import * as React from "react"
import { Search, MapPin, Plus, Store, Phone, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { adminService } from "@/services/api"
import { cn } from "@/lib/utils"

export function Venues() {
  const [venues, setVenues] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingVenue, setEditingVenue] = React.useState<any | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    status: "active"
  })

  // Fetch Venues
  const fetchVenues = async () => {
    setLoading(true)
    try {
      const data = await adminService.getVenues()
      setVenues(data)
    } catch (error) {
      console.error("Failed to fetch venues", error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchVenues()
  }, [])

  const handleCreateClick = () => {
    setEditingVenue(null)
    setFormData({
      name: "",
      address: "",
      contact_email: "",
      contact_phone: "",
      status: "active"
    })
    setIsDialogOpen(true)
  }

  const handleEditClick = (venue: any) => {
    setEditingVenue(venue)
    setFormData({
      name: venue.name,
      address: venue.location || "",
      contact_email: venue.contact_email || "",
      contact_phone: venue.contact_phone || "",
      status: venue.is_open ? "active" : "inactive"
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      // Map frontend form data to backend schema
      // Backend expects: name, location, is_open, image_url (optional)
      const payload = {
        name: formData.name,
        location: formData.address,
        is_open: formData.status === "active",
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone
      }

      if (editingVenue) {
        await adminService.updateVenue(editingVenue.id, payload)
      } else {
        await adminService.createVenue(payload)
      }
      setIsDialogOpen(false)
      fetchVenues()
    } catch (error) {
      console.error("Failed to save venue", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) return
    try {
      await adminService.deleteVenue(id)
      fetchVenues()
    } catch (error) {
      console.error("Failed to delete venue", error)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-0 relative min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Venues</h2>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Venue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Management</CardTitle>
          <CardDescription>Manage your partner locations.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar - Visual Only for now */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search venues..."
                className="pl-8"
              />
            </div>
            <div className="ml-auto">
              <Button variant="outline" onClick={fetchVenues}>Refresh</Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{venue.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {venue.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {venue.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{venue.contact_email}</span>
                        <span className="text-xs text-muted-foreground">{venue.contact_phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={venue.status === 'active' ? 'default' : 'secondary'}>
                        {venue.status || 'Active'}
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(venue)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(venue.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {venues.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">No venues found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Using absolute positioning trick reused from Users.tsx */}
        <DialogContent className="absolute top-[10%] left-[50%] z-[9999] grid w-full max-w-lg translate-x-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 bg-background sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
            <DialogDescription>
              {editingVenue ? "Update venue details." : "Register a new partner location."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>
              {editingVenue ? "Save Changes" : "Create Venue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
