import * as React from "react"
import { Package, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

export function Bottles() {
  const [bottles, setBottles] = React.useState<any[]>([])
  const [venues, setVenues] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedVenueId, setSelectedVenueId] = React.useState<string>("all")

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingBottle, setEditingBottle] = React.useState<any | null>(null)
  const [formData, setFormData] = React.useState({
    venue_id: "",
    brand: "",
    name: "",
    price: "",
    ml: "",
    image_url: "",
    is_available: true
  })

  // Confirmation dialog
  const { confirm, dialog } = useConfirmDialog()

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [bottlesData, venuesData] = await Promise.all([
        adminService.getBottles(),
        adminService.getVenues()
      ])
      setBottles(bottlesData)
      setVenues(venuesData)
    } catch (error) {
      console.error("Failed to load data", error)
      toast.error("Failed to load bottles")
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const handleCreateClick = () => {
    setEditingBottle(null)
    setFormData({
      venue_id: venues.length > 0 ? venues[0].id : "",
      brand: "",
      name: "",
      price: "",
      ml: "",
      image_url: "",
      is_available: true
    })
    setIsDialogOpen(true)
  }

  const handleEditClick = (bottle: any) => {
    setEditingBottle(bottle)
    setFormData({
      venue_id: bottle.venue_id,
      brand: bottle.brand,
      name: bottle.name,
      price: bottle.price.toString(),
      ml: bottle.volume_ml.toString(),
      image_url: bottle.image_url || "",
      is_available: bottle.is_available
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    confirm({
      title: "Delete Bottle",
      description: "Are you sure you want to delete this bottle? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await adminService.deleteBottle(id)
          toast.success("Bottle deleted successfully")
          loadData(true)
        } catch (error: any) {
          console.error("Failed to delete bottle", error)
          toast.error(error.response?.data?.detail || "Failed to delete bottle")
        }
      }
    })
  }

  const handleSave = async () => {
    try {
      const payload = {
        venue_id: formData.venue_id,
        brand: formData.brand,
        name: formData.name,
        price: parseFloat(formData.price),
        ml: parseInt(formData.ml),
        image_url: formData.image_url || null,
        is_available: formData.is_available
      }

      if (editingBottle) {
        await adminService.updateBottle(editingBottle.id, payload)
        toast.success("Bottle updated successfully")
      } else {
        await adminService.createBottle(payload)
        toast.success("Bottle created successfully")
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Failed to save bottle", error)
      toast.error("Failed to save bottle")
    }
  }

  const filteredBottles = bottles.filter(bottle => {
    const matchesVenue = selectedVenueId === "all" || bottle.venue_id === selectedVenueId
    const matchesSearch =
      bottle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bottle.brand.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesVenue && matchesSearch
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bottles Inventory</h2>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bottle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bottle List</CardTitle>
          <CardDescription>Manage bottle inventory across all venues.</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchPlaceholder="Search bottles by name or brand..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                id: "venue",
                label: "All Venues",
                value: selectedVenueId,
                onChange: setSelectedVenueId,
                options: [
                  { value: "all", label: "All Venues" },
                  ...venues.map(v => ({ value: v.id, label: v.name }))
                ]
              }
            ]}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <TableSkeletonLoader rows={5} columns={7} />
          ) : filteredBottles.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No bottles found"
              description={searchQuery || selectedVenueId !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first bottle to the inventory"}
              action={!searchQuery && selectedVenueId === "all" ? {
                label: "Add Bottle",
                onClick: handleCreateClick
              } : undefined}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bottle Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBottles.map((bottle) => (
                    <TableRow key={bottle.id}>
                      <TableCell className="font-medium">
                        {bottle.name}
                        <span className="block text-xs text-muted-foreground md:hidden">{bottle.brand}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{bottle.brand}</TableCell>
                      <TableCell>{bottle.venue_name}</TableCell>
                      <TableCell>{bottle.volume_ml}ml</TableCell>
                      <TableCell>₹{bottle.price}</TableCell>
                      <TableCell>
                        <Badge variant={bottle.is_available ? "default" : "secondary"}>
                          {bottle.is_available ? "Available" : "Unavailable"}
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
                            <DropdownMenuItem onClick={() => handleEditClick(bottle)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(bottle.id)}
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

      {dialog}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBottle ? "Edit Bottle" : "Add New Bottle"}</DialogTitle>
            <DialogDescription>
              {editingBottle ? "Update bottle details." : "Add a new bottle to the inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="venue" className="text-right">Venue</Label>
              <Select
                value={formData.venue_id}
                onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brand" className="text-right">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="col-span-3"
              />
            </div>
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
              <Label htmlFor="price" className="text-right">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ml" className="text-right">Volume (ml)</Label>
              <Input
                id="ml"
                type="number"
                value={formData.ml}
                onChange={(e) => setFormData({ ...formData, ml: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="col-span-3"
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_available" className="text-right">Available</Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBottle ? "Save Changes" : "Create Bottle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
