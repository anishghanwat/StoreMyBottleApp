import * as React from "react"
import { adminService } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Printer, FileText } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"

type ReportType = "revenue" | "sales" | "inventory" | "user-activity"

export function Reports() {
    const [reportType, setReportType] = React.useState<ReportType>("revenue")
    const [startDate, setStartDate] = React.useState<Date>()
    const [endDate, setEndDate] = React.useState<Date>()
    const [venueId, setVenueId] = React.useState<string>("")
    const [venues, setVenues] = React.useState<any[]>([])
    const [reportData, setReportData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)
    const [generating, setGenerating] = React.useState(false)

    React.useEffect(() => {
        fetchVenues()
    }, [])

    const fetchVenues = async () => {
        try {
            const data = await adminService.getVenues()
            setVenues(data)
        } catch (error) {
            console.error("Failed to fetch venues:", error)
        }
    }

    const generateReport = async () => {
        setGenerating(true)
        setLoading(true)
        try {
            const filters: any = {}

            if (startDate) {
                filters.start_date = format(startDate, "yyyy-MM-dd")
            }
            if (endDate) {
                filters.end_date = format(endDate, "yyyy-MM-dd")
            }
            if (venueId) {
                filters.venue_id = venueId
            }

            let data
            switch (reportType) {
                case "revenue":
                    data = await adminService.getRevenueReport(filters)
                    break
                case "sales":
                    data = await adminService.getSalesReport(filters)
                    break
                case "inventory":
                    data = await adminService.getInventoryReport(filters)
                    break
                case "user-activity":
                    data = await adminService.getUserActivityReport(filters)
                    break
            }

            setReportData(data)
            toast.success("Report generated successfully")
        } catch (error: any) {
            console.error("Failed to generate report:", error)
            toast.error(error.response?.data?.detail || "Failed to generate report")
        } finally {
            setLoading(false)
            setGenerating(false)
        }
    }

    const exportToCSV = () => {
        if (!reportData || !reportData.items) return

        let csvContent = ""
        let headers: string[] = []

        // Define headers based on report type
        switch (reportType) {
            case "revenue":
                headers = ["Date", "Venue", "Bottle", "Brand", "Quantity", "Unit Price", "Total Revenue", "Payment Method"]
                csvContent = headers.join(",") + "\n"
                reportData.items.forEach((item: any) => {
                    csvContent += `${item.date},${item.venue_name},"${item.bottle_name}","${item.bottle_brand}",${item.quantity},${Number(item.unit_price).toFixed(2)},${Number(item.total_revenue).toFixed(2)},${item.payment_method || "N/A"}\n`
                })
                break
            case "sales":
                headers = ["Bottle", "Brand", "Venue", "Quantity Sold", "Total Revenue", "Average Price"]
                csvContent = headers.join(",") + "\n"
                reportData.items.forEach((item: any) => {
                    csvContent += `"${item.bottle_name}","${item.bottle_brand}",${item.venue_name},${item.quantity_sold},${Number(item.total_revenue).toFixed(2)},${Number(item.average_price).toFixed(2)}\n`
                })
                break
            case "inventory":
                headers = ["Bottle", "Brand", "Venue", "Price", "Volume (ml)", "Available", "Total Sold", "Total Revenue"]
                csvContent = headers.join(",") + "\n"
                reportData.items.forEach((item: any) => {
                    csvContent += `"${item.bottle_name}","${item.bottle_brand}",${item.venue_name},${Number(item.price).toFixed(2)},${item.volume_ml},${item.is_available ? "Yes" : "No"},${item.total_sold},${Number(item.total_revenue).toFixed(2)}\n`
                })
                break
            case "user-activity":
                headers = ["User", "Email", "Total Purchases", "Total Spent", "Total Redemptions", "Last Activity", "Joined Date"]
                csvContent = headers.join(",") + "\n"
                reportData.items.forEach((item: any) => {
                    csvContent += `"${item.user_name}",${item.user_email || "N/A"},${item.total_purchases},${Number(item.total_spent).toFixed(2)},${item.total_redemptions},${item.last_activity || "N/A"},${item.joined_date}\n`
                })
                break
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${reportType}-report-${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Report exported to CSV")
    }

    const printReport = () => {
        window.print()
        toast.success("Print dialog opened")
    }

    const renderReportTable = () => {
        if (!reportData || !reportData.items || reportData.items.length === 0) {
            return (
                <EmptyState
                    icon={FileText}
                    title="No data available"
                    description="Generate a report to see data here"
                />
            )
        }

        switch (reportType) {
            case "revenue":
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Venue</TableHead>
                                <TableHead>Bottle</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                                <TableHead>Payment Method</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.venue_name}</TableCell>
                                    <TableCell>{item.bottle_name}</TableCell>
                                    <TableCell>{item.bottle_brand}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.unit_price).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.total_revenue).toFixed(2)}</TableCell>
                                    <TableCell>{item.payment_method || "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )

            case "sales":
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bottle</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Venue</TableHead>
                                <TableHead className="text-right">Quantity Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                                <TableHead className="text-right">Average Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.items.map((item: any) => (
                                <TableRow key={item.bottle_id}>
                                    <TableCell>{item.bottle_name}</TableCell>
                                    <TableCell>{item.bottle_brand}</TableCell>
                                    <TableCell>{item.venue_name}</TableCell>
                                    <TableCell className="text-right">{item.quantity_sold}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.total_revenue).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.average_price).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )

            case "inventory":
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bottle</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Venue</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Volume (ml)</TableHead>
                                <TableHead>Available</TableHead>
                                <TableHead className="text-right">Total Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.items.map((item: any) => (
                                <TableRow key={item.bottle_id}>
                                    <TableCell>{item.bottle_name}</TableCell>
                                    <TableCell>{item.bottle_brand}</TableCell>
                                    <TableCell>{item.venue_name}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.price).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{item.volume_ml}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs ${item.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                            {item.is_available ? "Yes" : "No"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{item.total_sold}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.total_revenue).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )

            case "user-activity":
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Total Purchases</TableHead>
                                <TableHead className="text-right">Total Spent</TableHead>
                                <TableHead className="text-right">Total Redemptions</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead>Joined Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.items.map((item: any) => (
                                <TableRow key={item.user_id}>
                                    <TableCell>{item.user_name}</TableCell>
                                    <TableCell>{item.user_email || "N/A"}</TableCell>
                                    <TableCell className="text-right">{item.total_purchases}</TableCell>
                                    <TableCell className="text-right">₹{Number(item.total_spent).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{item.total_redemptions}</TableCell>
                                    <TableCell>{item.last_activity ? new Date(item.last_activity).toLocaleDateString() : "N/A"}</TableCell>
                                    <TableCell>{new Date(item.joined_date).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )
        }
    }

    const renderSummary = () => {
        if (!reportData) return null

        switch (reportType) {
            case "revenue":
                return (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{Number(reportData.total_revenue).toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.total_transactions}</div>
                            </CardContent>
                        </Card>
                    </div>
                )

            case "sales":
                return (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Bottles Sold</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.total_bottles_sold}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{Number(reportData.total_revenue).toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>
                )

            case "inventory":
                return (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Bottles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.total_bottles}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Available</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{reportData.available_bottles}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Unavailable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{reportData.unavailable_bottles}</div>
                            </CardContent>
                        </Card>
                    </div>
                )

            case "user-activity":
                return (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.total_users}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.active_users}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{Number(reportData.total_spent).toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>
                )
        }
    }

    return (
        <div className="space-y-4 py-4">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Reports</CardTitle>
                    <CardDescription>Select report type and filters to generate detailed reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Report Type</label>
                            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="revenue">Revenue Report</SelectItem>
                                    <SelectItem value="sales">Sales Report</SelectItem>
                                    <SelectItem value="inventory">Inventory Report</SelectItem>
                                    <SelectItem value="user-activity">User Activity Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {reportType !== "inventory" && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </>
                        )}

                        {reportType !== "user-activity" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Venue</label>
                                <Select value={venueId || "all"} onValueChange={(value) => setVenueId(value === "all" ? "" : value)}>
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
                        )}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={generateReport} disabled={generating}>
                            {generating ? "Generating..." : "Generate Report"}
                        </Button>
                        {reportData && (
                            <>
                                <Button variant="outline" onClick={exportToCSV}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </Button>
                                <Button variant="outline" onClick={printReport}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <>
                    {renderSummary()}
                    <Card>
                        <CardHeader>
                            <CardTitle>Report Data</CardTitle>
                            <CardDescription>
                                {reportType === "inventory"
                                    ? "Current inventory status"
                                    : `${reportData.start_date} to ${reportData.end_date}`
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <TableSkeletonLoader columns={8} rows={10} />
                            ) : (
                                <div className="overflow-x-auto">
                                    {renderReportTable()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
