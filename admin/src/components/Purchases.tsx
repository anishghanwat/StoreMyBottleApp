import * as React from "react"
import { ShoppingCart } from "lucide-react"
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
import { formatDate } from "@/lib/utils"

export function Purchases() {
  const [purchases, setPurchases] = React.useState<any[]>([])
  const [venues, setVenues] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [venueFilter, setVenueFilter] = React.useState("all")

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [purchasesData, venuesData] = await Promise.all([
        adminService.getPurchases(),
        adminService.getVenues()
      ])
      setPurchases(purchasesData.purchases)
      setVenues(venuesData)
    } catch (error) {
      console.error("Failed to load purchases", error)
      toast.error("Failed to load purchases")
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

      const data = await adminService.getPurchases(filters)
      setPurchases(data.purchases)
    } catch (error) {
      console.error("Failed to filter purchases", error)
      toast.error("Failed to filter purchases")
    } finally {
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    if (statusFilter !== "all" || venueFilter !== "all") {
      handleFilterChange()
    }
  }, [statusFilter, venueFilter])

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (purchase.user_email && purchase.user_email.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Paid"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Purchase History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>View all bottle purchases made by users.</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchPlaceholder="Search by ID, user name, or email..."
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
                label: "Payment Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "All Statuses" },
                  { value: "confirmed", label: "Paid" },
                  { value: "pending", label: "Pending" },
                  { value: "failed", label: "Failed" }
                ]
              }
            ]}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
          />

          {loading ? (
            <TableSkeletonLoader rows={5} columns={8} />
          ) : filteredPurchases.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No purchases found"
              description={searchQuery || statusFilter !== "all" || venueFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No purchases have been made yet"}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Bottle</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-xs">
                        {purchase.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{purchase.user_name}</div>
                          {purchase.user_email && (
                            <div className="text-xs text-muted-foreground">{purchase.user_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{purchase.venue_name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{purchase.bottle_name}</div>
                          <div className="text-xs text-muted-foreground">{purchase.bottle_brand}</div>
                        </div>
                      </TableCell>
                      <TableCell>₹{purchase.purchase_price}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(purchase.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(purchase.payment_status)}>
                          {getStatusLabel(purchase.payment_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{purchase.remaining_ml}ml</div>
                          <div className="text-xs text-muted-foreground">of {purchase.total_ml}ml</div>
                        </div>
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
