import * as React from "react"
import { Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"
import { formatTimeAgo } from "@/lib/utils"

export function Redemptions() {
  const [redemptions, setRedemptions] = React.useState<any[]>([])
  const [venues, setVenues] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [venueFilter, setVenueFilter] = React.useState("all")

  React.useEffect(() => {
    loadData()

    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadData(true) // Silent refresh
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [redemptionsData, venuesData] = await Promise.all([
        adminService.getRedemptions(),
        adminService.getVenues()
      ])
      setRedemptions(redemptionsData.redemptions)
      setVenues(venuesData)
    } catch (error) {
      console.error("Failed to load redemptions", error)
      if (!silent) toast.error("Failed to load redemptions")
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const handleFilterChange = async () => {
    setRefreshing(true)
    try {
      const filters: any = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (venueFilter !== "all") filters.venue_id = venueFilter

      const data = await adminService.getRedemptions(filters)
      setRedemptions(data.redemptions)
    } catch (error) {
      console.error("Failed to filter redemptions", error)
      toast.error("Failed to filter redemptions")
    } finally {
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    if (statusFilter !== "all" || venueFilter !== "all") {
      handleFilterChange()
    }
  }, [statusFilter, venueFilter])

  const filteredRedemptions = redemptions.filter(redemption => {
    const matchesSearch =
      redemption.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.bottle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.bottle_brand.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "redeemed":
        return "default"
      case "pending":
        return "secondary"
      case "expired":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "redeemed":
        return "Served"
      case "pending":
        return "Pending"
      case "expired":
        return "Expired"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "redeemed":
        return "bg-green-500 hover:bg-green-600"
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600 text-black"
      case "expired":
        return "bg-gray-500 hover:bg-gray-600"
      case "cancelled":
        return "bg-red-500 hover:bg-red-600"
      default:
        return ""
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Redemptions</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drink Requests</CardTitle>
          <CardDescription>Live feed of redemption requests and history (auto-refreshes every 10s).</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchPlaceholder="Search by ID, user, or bottle..."
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
              },
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "redeemed", label: "Served" },
                  { value: "expired", label: "Expired" },
                  { value: "cancelled", label: "Cancelled" }
                ]
              }
            ]}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <TableSkeletonLoader rows={5} columns={8} />
          ) : filteredRedemptions.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No redemptions found"
              description={searchQuery || statusFilter !== "all" || venueFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No redemption requests yet"}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Bottle</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Served By</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRedemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell className="font-mono text-xs">
                        {redemption.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{redemption.user_name}</div>
                          {redemption.user_email && (
                            <div className="text-xs text-muted-foreground">{redemption.user_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{redemption.bottle_name}</div>
                          <div className="text-xs text-muted-foreground">{redemption.bottle_brand}</div>
                        </div>
                      </TableCell>
                      <TableCell>{redemption.venue_name}</TableCell>
                      <TableCell>{redemption.peg_size_ml}ml</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(redemption.status)}
                          className={getStatusColor(redemption.status)}
                        >
                          {getStatusLabel(redemption.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {redemption.redeemed_by_staff_name || "-"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {redemption.status === "redeemed" && redemption.redeemed_at
                          ? formatTimeAgo(redemption.redeemed_at)
                          : formatTimeAgo(redemption.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
