import { useState, useEffect } from 'react'
import { Plus, Package } from 'lucide-react'
import { adminService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TableSkeletonLoader } from '@/components/ui/skeleton-loader'
import { EmptyState } from '@/components/ui/empty-state'
import { SearchFilterBar } from '@/components/ui/search-filter-bar'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface Bottle {
    id: string
    venue_id: string
    name: string
    brand: string
    price: number
    volume_ml: number
    image_url: string | null
    is_available: boolean
}

interface Venue {
    id: string
    name: string
}

export function Inventory() {
    const [bottles, setBottles] = useState<Bottle[]>([])
    const [venues, setVenues] = useState<Venue[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingBottle, setEditingBottle] = useState<Bottle | null>(null)
    const [selectedVenueId, setSelectedVenueId] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const [formData, setFormData] = useState({
        venue_id: '',
        name: '',
        brand: '',
        price: '',
        volume_ml: '',
        image_url: '',
        is_available: true,
    })

    const { confirm, dialog } = useConfirmDialog()

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const [bottlesData, venuesData] = await Promise.all([
                adminService.getBottles(),
                adminService.getVenues(),
            ])
            setBottles(bottlesData)
            setVenues(venuesData)
        } catch (error) {
            console.error('Failed to load data:', error)
            if (!silent) toast.error('Failed to load inventory')
        } finally {
            if (!silent) setLoading(false)
            else setRefreshing(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const handleCreateClick = () => {
        setEditingBottle(null)
        setFormData({
            venue_id: venues.length > 0 ? venues[0].id : '',
            name: '',
            brand: '',
            price: '',
            volume_ml: '',
            image_url: '',
            is_available: true,
        })
        setIsDialogOpen(true)
    }

    const handleEditClick = (bottle: Bottle) => {
        setEditingBottle(bottle)
        setFormData({
            venue_id: bottle.venue_id,
            name: bottle.name,
            brand: bottle.brand,
            price: bottle.price.toString(),
            volume_ml: bottle.volume_ml.toString(),
            image_url: bottle.image_url || '',
            is_available: bottle.is_available,
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (bottle: Bottle) => {
        confirm({
            title: 'Delete Bottle',
            description: `Are you sure you want to delete "${bottle.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    await adminService.deleteBottle(bottle.id)
                    toast.success('Bottle deleted successfully')
                    loadData(true)
                } catch (error) {
                    console.error('Failed to delete bottle:', error)
                    toast.error('Failed to delete bottle')
                }
            },
        })
    }

    const handleSave = async () => {
        if (!formData.venue_id || !formData.name || !formData.brand || !formData.price || !formData.volume_ml) {
            toast.error('Please fill in all required fields')
            return
        }
        try {
            const payload = {
                venue_id: formData.venue_id,
                name: formData.name,
                brand: formData.brand,
                price: parseFloat(formData.price),
                volume_ml: parseInt(formData.volume_ml),
                image_url: formData.image_url || null,
                is_available: formData.is_available,
            }
            if (editingBottle) {
                await adminService.updateBottle(editingBottle.id, payload)
                toast.success('Bottle updated successfully')
            } else {
                await adminService.createBottle(payload)
                toast.success('Bottle created successfully')
            }
            setIsDialogOpen(false)
            loadData(true)
        } catch (error) {
            console.error('Failed to save bottle:', error)
            toast.error('Failed to save bottle')
        }
    }

    const filteredBottles = bottles.filter(bottle => {
        const matchesVenue = selectedVenueId === 'all' || bottle.venue_id === selectedVenueId
        const matchesSearch =
            bottle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bottle.brand.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesVenue && matchesSearch
    })

    const update = (key: keyof typeof formData, value: any) =>
        setFormData(prev => ({ ...prev, [key]: value }))

    return (
        <div className="flex flex-col gap-4 p-4">
            {dialog}

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                <Button onClick={handleCreateClick}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bottle
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bottle Catalogue</CardTitle>
                    <CardDescription>Manage bottles available across all venues.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SearchFilterBar
                        searchPlaceholder="Search by name or brand…"
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={[
                            {
                                id: 'venue',
                                label: 'All Venues',
                                value: selectedVenueId,
                                onChange: setSelectedVenueId,
                                options: [
                                    { value: 'all', label: 'All Venues' },
                                    ...venues.map(v => ({ value: v.id, label: v.name })),
                                ],
                            },
                        ]}
                        onRefresh={() => loadData(true)}
                        refreshing={refreshing}
                    />

                    {loading ? (
                        <TableSkeletonLoader rows={5} columns={6} />
                    ) : filteredBottles.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No bottles found"
                            description={searchQuery || selectedVenueId !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first bottle'}
                            action={!searchQuery && selectedVenueId === 'all' ? {
                                label: 'Add Bottle',
                                onClick: handleCreateClick,
                            } : undefined}
                        />
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bottle</TableHead>
                                        <TableHead>Venue</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBottles.map(bottle => {
                                        const venueName = venues.find(v => v.id === bottle.venue_id)?.name ?? 'Unknown'
                                        return (
                                            <TableRow key={bottle.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md border bg-muted overflow-hidden flex-shrink-0">
                                                            {bottle.image_url
                                                                ? <img src={bottle.image_url} alt={bottle.name} className="h-full w-full object-cover" />
                                                                : <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                                                            }
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{bottle.name}</div>
                                                            <div className="text-xs text-muted-foreground">{bottle.brand}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{venueName}</TableCell>
                                                <TableCell>{bottle.volume_ml} ml</TableCell>
                                                <TableCell>₹{bottle.price}</TableCell>
                                                <TableCell>
                                                    <Badge variant={bottle.is_available ? 'default' : 'secondary'}>
                                                        {bottle.is_available ? 'Available' : 'Unavailable'}
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
                                                                onClick={() => handleDelete(bottle)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editingBottle ? 'Edit Bottle' : 'Add New Bottle'}</DialogTitle>
                        <DialogDescription>
                            {editingBottle ? 'Update bottle details.' : 'Add a new bottle to the catalogue.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Venue */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Venue *</Label>
                            <Select value={formData.venue_id} onValueChange={v => update('venue_id', v)}>
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
                        {/* Brand */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Brand *</Label>
                            <Input
                                value={formData.brand}
                                onChange={e => update('brand', e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Johnnie Walker"
                            />
                        </div>
                        {/* Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={e => update('name', e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Black Label"
                            />
                        </div>
                        {/* Price */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Price (₹) *</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.price}
                                onChange={e => update('price', e.target.value)}
                                className="col-span-3"
                                placeholder="3500"
                            />
                        </div>
                        {/* Volume */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Volume (ml) *</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.volume_ml}
                                onChange={e => update('volume_ml', e.target.value)}
                                className="col-span-3"
                                placeholder="750"
                            />
                        </div>
                        {/* Image URL */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Image URL</Label>
                            <Input
                                value={formData.image_url}
                                onChange={e => update('image_url', e.target.value)}
                                className="col-span-3"
                                placeholder="https://…"
                            />
                        </div>
                        {/* Available */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Available</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Switch
                                    checked={formData.is_available}
                                    onCheckedChange={v => update('is_available', v)}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {formData.is_available ? 'Available for sale' : 'Not available'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            {editingBottle ? 'Save Changes' : 'Create Bottle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Keep default export alias for backward compat (App.tsx imports named export)
export default Inventory
