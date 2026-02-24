import * as React from "react"
import { adminService } from "@/services/api"
import { Plus, Tag, Pencil, Trash2, Copy, MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

export function Promotions() {
  const [promotions, setPromotions] = React.useState<any[]>([])
  const [venues, setVenues] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [venueFilter, setVenueFilter] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPromotion, setEditingPromotion] = React.useState<any>(null)
  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: "",
    min_purchase_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    per_user_limit: "",
    venue_id: "",
    valid_from: "",
    valid_until: "",
    status: "active"
  })

  // Confirmation dialog
  const { confirm, dialog } = useConfirmDialog()

  React.useEffect(() => {
    fetchPromotions()
    fetchVenues()
  }, [statusFilter, venueFilter])

  const fetchPromotions = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const filters: any = {}
      if (statusFilter) filters.status = statusFilter
      if (venueFilter) filters.venue_id = venueFilter

      const data = await adminService.getPromotions(filters)
      setPromotions(data.promotions)
    } catch (error: any) {
      console.error("Failed to fetch promotions:", error)
      toast.error(error.response?.data?.detail || "Failed to fetch promotions")
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const fetchVenues = async () => {
    try {
      const data = await adminService.getVenues()
      setVenues(data)
    } catch (error) {
      console.error("Failed to fetch venues:", error)
    }
  }

  const handleCreate = () => {
    setEditingPromotion(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: "",
      min_purchase_amount: "",
      max_discount_amount: "",
      usage_limit: "",
      per_user_limit: "",
      venue_id: "",
      valid_from: "",
      valid_until: "",
      status: "active"
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion)
    setFormData({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description || "",
      type: promotion.type,
      value: promotion.value.toString(),
      min_purchase_amount: promotion.min_purchase_amount?.toString() || "",
      max_discount_amount: promotion.max_discount_amount?.toString() || "",
      usage_limit: promotion.usage_limit?.toString() || "",
      per_user_limit: promotion.per_user_limit?.toString() || "",
      venue_id: promotion.venue_id || "",
      valid_from: format(new Date(promotion.valid_from), "yyyy-MM-dd'T'HH:mm"),
      valid_until: format(new Date(promotion.valid_until), "yyyy-MM-dd'T'HH:mm"),
      status: promotion.status
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: formData.per_user_limit ? parseInt(formData.per_user_limit) : null,
        venue_id: formData.venue_id || null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString()
      }

      if (editingPromotion) {
        await adminService.updatePromotion(editingPromotion.id, payload)
        toast.success("Promotion updated successfully")
      } else {
        await adminService.createPromotion(payload)
        toast.success("Promotion created successfully")
      }

      setIsDialogOpen(false)
      fetchPromotions(true)
    } catch (error: any) {
      console.error("Failed to save promotion:", error)
      toast.error(error.response?.data?.detail || "Failed to save promotion")
    }
  }

  const handleDelete = async (id: string) => {
    confirm({
      title: "Delete Promotion",
      description: "Are you sure you want to delete this promotion? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await adminService.deletePromotion(id)
          toast.success("Promotion deleted successfully")
          fetchPromotions(true)
        } catch (error: any) {
          console.error("Failed to delete promotion:", error)
          toast.error(error.response?.data?.detail || "Failed to delete promotion")
        }
      }
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
  }

  const filteredPromotions = promotions.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = promotions.filter(p => p.status === "active").length
  const totalUsage = promotions.reduce((sum, p) => sum + p.usage_count, 0)

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: "default",
      inactive: "secondary",
      expired: "destructive"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const colors: any = {
      percentage: "bg-blue-100 text-blue-800",
      fixed_amount: "bg-green-100 text-green-800",
      free_peg: "bg-purple-100 text-purple-800"
    }
    return <Badge className={colors[type] || ""}>{type.replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promotions & Offers</h2>
          <p className="text-muted-foreground">Manage discount codes and special offers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Promotion
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">Times redeemed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Promotions</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promotions..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={venueFilter} onValueChange={setVenueFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeletonLoader rows={5} columns={9} />
          ) : filteredPromotions.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No promotions found"
              description={searchQuery || statusFilter || venueFilter
                ? "Try adjusting your search or filters"
                : "Create your first promotion to offer discounts to customers"}
              action={!searchQuery && !statusFilter && !venueFilter ? {
                label: "Create Promotion",
                onClick: handleCreate
              } : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {promo.code}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyCode(promo.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{promo.name}</TableCell>
                    <TableCell>{getTypeBadge(promo.type)}</TableCell>
                    <TableCell>
                      {promo.type === "percentage" ? `${promo.value}%` : `₹${Number(promo.value).toFixed(2)}`}
                    </TableCell>
                    <TableCell>{promo.venue_name || "All Venues"}</TableCell>
                    <TableCell>
                      {promo.usage_count}
                      {promo.usage_limit && ` / ${promo.usage_limit}`}
                    </TableCell>
                    <TableCell>{new Date(promo.valid_until).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(promo.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(promo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(promo.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromotion ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
            <DialogDescription>
              {editingPromotion ? "Update promotion details" : "Create a new promotion or discount code"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Summer Sale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="20% off on all bottles"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="free_peg">Free Peg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder={formData.type === "percentage" ? "20" : "100"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase">Min Purchase Amount</Label>
                <Input
                  id="min_purchase"
                  type="number"
                  placeholder="500"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_discount">Max Discount Amount</Label>
                <Input
                  id="max_discount"
                  type="number"
                  placeholder="200"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Total Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder="100"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_user_limit">Per User Limit</Label>
                <Input
                  id="per_user_limit"
                  type="number"
                  placeholder="1"
                  value={formData.per_user_limit}
                  onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue (Optional)</Label>
              <Select value={formData.venue_id || "all"} onValueChange={(value: string) => setFormData({ ...formData, venue_id: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPromotion ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  )
}
