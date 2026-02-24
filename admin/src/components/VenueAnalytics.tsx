import * as React from "react"
import { adminService } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, TrendingUp, Award, Users, ShoppingBag, Ticket, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { CardSkeletonLoader, TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"

export function VenueAnalytics() {
    const [view, setView] = React.useState<"comparison" | "detailed">("comparison")
    const [selectedVenueId, setSelectedVenueId] = React.useState<string>("")
    const [startDate, setStartDate] = React.useState<Date>()
    const [endDate, setEndDate] = React.useState<Date>()
    const [venues, setVenues] = React.useState<any[]>([])
    const [comparisonData, setComparisonData] = React.useState<any>(null)
    const [detailedData, setDetailedData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)
    const [refreshing, setRefreshing] = React.useState(false)

    React.useEffect(() => {
        fetchVenues()
        fetchComparisonData()
    }, [])

    const fetchVenues = async () => {
        try {
            const data = await adminService.getVenues()
            setVenues(data)
            if (data.length > 0) {
                setSelectedVenueId(data[0].id)
            }
        } catch (error) {
            console.error("Failed to fetch venues:", error)
        }
    }

    const fetchComparisonData = async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)

        try {
            const filters: any = {}
            if (startDate) filters.start_date = format(startDate, "yyyy-MM-dd")
            if (endDate) filters.end_date = format(endDate, "yyyy-MM-dd")

            const data = await adminService.getVenueComparison(filters)
            setComparisonData(data)
        } catch (error: any) {
            console.error("Failed to fetch comparison data:", error)
            toast.error(error.response?.data?.detail || "Failed to fetch comparison data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const fetchDetailedData = async (venueId: string, silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)

        try {
            const filters: any = {}
            if (startDate) filters.start_date = format(startDate, "yyyy-MM-dd")
            if (endDate) filters.end_date = format(endDate, "yyyy-MM-dd")

            const data = await adminService.getVenueDetailedAnalytics(venueId, filters)
            setDetailedData(data)
        } catch (error: any) {
            console.error("Failed to fetch detailed data:", error)
            toast.error(error.response?.data?.detail || "Failed to fetch detailed data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleViewChange = (newView: "comparison" | "detailed") => {
        setView(newView)
        if (newView === "detailed" && selectedVenueId) {
            fetchDetailedData(selectedVenueId)
        }
    }

    const handleVenueChange = (venueId: string) => {
        setSelectedVenueId(venueId)
        if (view === "detailed") {
            fetchDetailedData(venueId)
        }
    }

    const getRankBadge = (rank: number, total: number) => {
        if (rank === 1) {
            return <Badge className="bg-yellow-500"><Award className="w-3 h-3 mr-1" />1st</Badge>
        } else if (rank === 2) {
            return <Badge className="bg-gray-400">2nd</Badge>
        } else if (rank === 3) {
            return <Badge className="bg-orange-600">3rd</Badge>
        } else {
            return <Badge variant="outline">{rank}th</Badge>
        }
    }

    return (
        <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Venue Performance Analytics</h2>
                    <p className="text-muted-foreground">Compare venues and analyze individual performance</p>
                </div>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : "Start Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : "End Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={() => view === "comparison" ? fetchComparisonData(true) : fetchDetailedData(selectedVenueId, true)} disabled={refreshing}>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>
            </div>

            <Tabs value={view} onValueChange={(v) => handleViewChange(v as "comparison" | "detailed")}>
                <TabsList>
                    <TabsTrigger value="comparison">Venue Comparison</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CardSkeletonLoader />
                                <CardSkeletonLoader />
                            </div>
                            <CardSkeletonLoader />
                        </div>
                    ) : comparisonData ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Revenue Comparison</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={comparisonData.comparison_data}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="venue_name" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                                                <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Sales Comparison</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={comparisonData.comparison_data}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="venue_name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="bottles_sold" fill="#82ca9d" name="Bottles Sold" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Rankings</CardTitle>
                                    <CardDescription>Venue performance metrics and rankings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Venue</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-center">Revenue Rank</TableHead>
                                                <TableHead className="text-right">Bottles Sold</TableHead>
                                                <TableHead className="text-center">Sales Rank</TableHead>
                                                <TableHead className="text-right">Redemptions</TableHead>
                                                <TableHead className="text-right">Customers</TableHead>
                                                <TableHead className="text-right">Avg Order</TableHead>
                                                <TableHead className="text-right">Redemption Rate</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {comparisonData.venues.map((venue: any) => (
                                                <TableRow key={venue.venue_id}>
                                                    <TableCell className="font-medium">{venue.venue_name}</TableCell>
                                                    <TableCell className="text-right">₹{Number(venue.total_revenue).toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">
                                                        {getRankBadge(venue.revenue_rank, comparisonData.total_venues)}
                                                    </TableCell>
                                                    <TableCell className="text-right">{venue.total_bottles_sold}</TableCell>
                                                    <TableCell className="text-center">
                                                        {getRankBadge(venue.sales_rank, comparisonData.total_venues)}
                                                    </TableCell>
                                                    <TableCell className="text-right">{venue.total_redemptions}</TableCell>
                                                    <TableCell className="text-right">{venue.total_customers}</TableCell>
                                                    <TableCell className="text-right">₹{Number(venue.average_order_value).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{venue.redemption_rate.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <EmptyState
                            icon={BarChart3}
                            title="No comparison data available"
                            description="Select a date range and click Refresh to view venue comparison"
                        />
                    )}
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Venue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedVenueId} onValueChange={handleVenueChange}>
                                <SelectTrigger className="w-full md:w-[300px]">
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
                        </CardContent>
                    </Card>

                    {loading ? (
                        <div className="space-y-4">
                            <CardSkeletonLoader />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CardSkeletonLoader />
                                <CardSkeletonLoader />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <CardSkeletonLoader />
                                <CardSkeletonLoader />
                                <CardSkeletonLoader />
                                <CardSkeletonLoader />
                            </div>
                            <CardSkeletonLoader />
                            <CardSkeletonLoader />
                        </div>
                    ) : detailedData ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{detailedData.venue_name}</CardTitle>
                                        <CardDescription>{detailedData.venue_location}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Revenue Rank:</span>
                                                <span>{getRankBadge(detailedData.revenue_rank, detailedData.total_venues)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Sales Rank:</span>
                                                <span>{getRankBadge(detailedData.sales_rank, detailedData.total_venues)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Active Bottles:</span>
                                                <span className="font-medium">{detailedData.active_bottles}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Total Customers:</span>
                                                <span className="font-medium">{detailedData.total_customers}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Redemption Rate:</span>
                                                <span className="font-medium">{detailedData.redemption_rate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            Total Revenue
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">₹{Number(detailedData.total_revenue).toFixed(2)}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This month: ₹{Number(detailedData.revenue_this_month).toFixed(2)}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-blue-600" />
                                            Bottles Sold
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{detailedData.total_bottles_sold}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This month: {detailedData.bottles_sold_this_month}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-purple-600" />
                                            Redemptions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{detailedData.total_redemptions}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This month: {detailedData.redemptions_this_month}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Users className="w-4 h-4 text-orange-600" />
                                            Avg Order Value
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">₹{Number(detailedData.average_order_value).toFixed(2)}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Trends</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={detailedData.revenue_trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (₹)" />
                                            <Line yAxisId="right" type="monotone" dataKey="bottles_sold" stroke="#82ca9d" name="Bottles Sold" />
                                            <Line yAxisId="right" type="monotone" dataKey="redemptions" stroke="#ffc658" name="Redemptions" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Selling Bottles</CardTitle>
                                    <CardDescription>Best performing bottles at this venue</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Bottle</TableHead>
                                                <TableHead>Brand</TableHead>
                                                <TableHead className="text-right">Quantity Sold</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detailedData.top_bottles.map((bottle: any, index: number) => (
                                                <TableRow key={bottle.bottle_id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {index < 3 && <Award className="w-4 h-4 text-yellow-500" />}
                                                            {bottle.bottle_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{bottle.bottle_brand}</TableCell>
                                                    <TableCell className="text-right">{bottle.quantity_sold}</TableCell>
                                                    <TableCell className="text-right">₹{Number(bottle.revenue).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <EmptyState
                            icon={BarChart3}
                            title={selectedVenueId ? "No detailed data available" : "Select a venue"}
                            description={selectedVenueId ? "Select a date range and click Refresh to view detailed analytics" : "Choose a venue from the dropdown above to view detailed analytics"}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
