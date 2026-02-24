import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { DashboardSkeletonLoader } from "@/components/ui/skeleton-loader"

export function Dashboard() {
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [revenueData, setRevenueData] = React.useState<any>(null)
  const [salesData, setSalesData] = React.useState<any>(null)
  const [redemptionData, setRedemptionData] = React.useState<any>(null)
  const [userData, setUserData] = React.useState<any>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch all analytics, but handle individual failures gracefully
      const results = await Promise.allSettled([
        adminService.getRevenueAnalytics(),
        adminService.getSalesAnalytics(),
        adminService.getRedemptionAnalytics(),
        adminService.getUserAnalytics()
      ])

      // Handle revenue
      if (results[0].status === 'fulfilled') {
        setRevenueData(results[0].value)
      } else {
        console.error("Revenue analytics failed:", results[0].reason)
        toast.error("Failed to load revenue analytics")
      }

      // Handle sales
      if (results[1].status === 'fulfilled') {
        setSalesData(results[1].value)
      } else {
        console.error("Sales analytics failed:", results[1].reason)
        toast.error("Failed to load sales analytics")
      }

      // Handle redemptions
      if (results[2].status === 'fulfilled') {
        setRedemptionData(results[2].value)
      } else {
        console.error("Redemption analytics failed:", results[2].reason)
        toast.error("Failed to load redemption analytics")
      }

      // Handle users
      if (results[3].status === 'fulfilled') {
        setUserData(results[3].value)
      } else {
        console.error("User analytics failed:", results[3].reason)
        toast.error("Failed to load user analytics")
      }
    } catch (error: any) {
      console.error("Failed to fetch analytics", error)
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return <DashboardSkeletonLoader />
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{revenueData?.total_revenue?.toLocaleString() || 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              This month: ₹{revenueData?.revenue_this_month?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        {/* Bottles Sold */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottles Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData?.total_bottles_sold?.toLocaleString() || 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              This month: {salesData?.bottles_sold_this_month?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        {/* Total Redemptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemptions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {redemptionData?.redeemed_count?.toLocaleString() || 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Rate: {redemptionData?.redemption_rate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.total_users?.toLocaleString() || 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              New this month: {userData?.new_users_this_month?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Trend */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData?.revenue_trend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {new Date(payload[0].payload.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Revenue
                              </span>
                              <span className="font-bold">
                                ₹{payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Venue */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Sales by Venue</CardTitle>
            <CardDescription>Top performing venues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={salesData?.sales_by_venue || []}
                layout="vertical"
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="venue_name"
                  type="category"
                  width={100}
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].payload.venue_name}
                              </span>
                              <span className="font-bold">
                                {payload[0].value} bottles
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ₹{payload[0].payload.revenue}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="bottles_sold" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Bottles & Recent Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Selling Bottles */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Bottles</CardTitle>
            <CardDescription>Best performers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData?.top_bottles?.slice(0, 5).map((bottle: any, index: number) => (
                <div key={bottle.bottle_id} className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {bottle.bottle_brand} {bottle.bottle_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {bottle.quantity_sold} sold
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    ₹{bottle.revenue?.toLocaleString()}
                  </div>
                </div>
              ))}
              {(!salesData?.top_bottles || salesData.top_bottles.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Average Order Value</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(revenueData?.average_order_value || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pending Redemptions</p>
                  <p className="text-2xl font-bold">
                    {redemptionData?.pending_count || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Active Venues</p>
                  <p className="text-2xl font-bold">
                    {revenueData?.revenue_by_venue?.length || 0}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">New Users Today</p>
                  <p className="text-2xl font-bold">
                    {userData?.new_users_today || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
