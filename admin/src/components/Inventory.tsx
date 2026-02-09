import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Pencil, Trash2, X, Search, Filter } from 'lucide-react'
import { adminService } from '../services/api'

interface Bottle {
    id: string
    venue_id: string
    name: string
    brand: string
    price: number
    volume_ml: number
    image_url: string
    is_available: boolean
}

interface Venue {
    id: string
    name: string
}

export default function Inventory() {
    const [bottles, setBottles] = useState<Bottle[]>([])
    const [venues, setVenues] = useState<Venue[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingBottle, setEditingBottle] = useState<Bottle | null>(null)

    // Filter state
    const [selectedVenueId, setSelectedVenueId] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    const [formData, setFormData] = useState({
        venue_id: "",
        name: "",
        brand: "",
        price: "",
        volume_ml: "",
        image_url: "",
        is_available: true
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [bottlesData, venuesData] = await Promise.all([
                adminService.getBottles(),
                adminService.getVenues()
            ])
            setBottles(bottlesData)
            setVenues(venuesData)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateClick = () => {
        setEditingBottle(null)
        setFormData({
            venue_id: venues.length > 0 ? venues[0].id : "",
            name: "",
            brand: "",
            price: "",
            volume_ml: "",
            image_url: "",
            is_available: true
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
            image_url: bottle.image_url || "",
            is_available: bottle.is_available
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this bottle?')) {
            try {
                await adminService.deleteBottle(id)
                loadData()
            } catch (error) {
                console.error('Failed to delete bottle:', error)
            }
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                venue_id: formData.venue_id,
                name: formData.name,
                brand: formData.brand,
                price: parseFloat(formData.price),
                ml: parseInt(formData.volume_ml), // Backend expects 'ml' alias or volume_ml
                image_url: formData.image_url,
                is_available: formData.is_available
            }

            if (editingBottle) {
                await adminService.updateBottle(editingBottle.id, payload)
            } else {
                await adminService.createBottle(payload)
            }
            setIsDialogOpen(false)
            loadData()
        } catch (error) {
            console.error('Failed to save bottle:', error)
        }
    }

    const filteredBottles = bottles.filter(bottle => {
        const matchesVenue = selectedVenueId === "all" || bottle.venue_id === selectedVenueId
        const matchesSearch = bottle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bottle.brand.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesVenue && matchesSearch
    })

    if (loading) return <div className="text-white">Loading inventory...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Bottle Inventory</h2>
                    <p className="text-gray-400">Manage bottles across all venues</p>
                </div>
                <button
                    onClick={handleCreateClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Bottle
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 bg-gray-800 rounded-lg">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search bottles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400" size={20} />
                    <select
                        value={selectedVenueId}
                        onChange={(e) => setSelectedVenueId(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg border-none"
                    >
                        <option value="all">All Venues</option>
                        {venues.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                        <tr>
                            <th className="p-4">Details</th>
                            <th className="p-4">Venue</th>
                            <th className="p-4">Size</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredBottles.map((bottle) => {
                            const venueName = venues.find(v => v.id === bottle.venue_id)?.name || 'Unknown'
                            return (
                                <tr key={bottle.id} className="hover:bg-gray-700/50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-700 overflow-hidden">
                                                {bottle.image_url ? (
                                                    <img src={bottle.image_url} alt={bottle.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{bottle.name}</div>
                                                <div className="text-sm text-gray-500">{bottle.brand}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">{venueName}</td>
                                    <td className="p-4">{bottle.volume_ml} ml</td>
                                    <td className="p-4">₹{bottle.price}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${bottle.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {bottle.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(bottle)}
                                                className="p-2 hover:bg-gray-600 rounded-lg text-blue-400"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bottle.id)}
                                                className="p-2 hover:bg-gray-600 rounded-lg text-red-400"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredBottles.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No bottles found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md shadow-xl">
                        <Dialog.Title className="text-xl font-bold text-white mb-4">
                            {editingBottle ? 'Edit Bottle' : 'Add New Bottle'}
                        </Dialog.Title>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Venue</label>
                                <select
                                    required
                                    value={formData.venue_id}
                                    onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                >
                                    <option value="" disabled>Select Venue</option>
                                    {venues.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Brand</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Volume (ml)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.volume_ml}
                                        onChange={(e) => setFormData({ ...formData, volume_ml: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_available"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="is_available" className="text-gray-300">Available for sale</label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
                                >
                                    Save
                                </button>
                            </div>
                        </form>

                        <Dialog.Close asChild>
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    )
}
