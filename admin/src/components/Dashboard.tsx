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
  YAxis
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const dataSold = [
  { name: "Mon", total: 12 },
  { name: "Tue", total: 18 },
  { name: "Wed", total: 24 },
  { name: "Thu", total: 32 },
  { name: "Fri", total: 45 },
  { name: "Sat", total: 56 },
  { name: "Sun", total: 38 },
]

const dataRedemptions = [
  { name: "Sky Bar", total: 124 },
  { name: "Ocean Club", total: 98 },
  { name: "High Spirits", total: 86 },
  { name: "The Vault", total: 72 },
  { name: "Neon Lounge", total: 65 },
]

const recentActivity = [
  {
    user: "John Doe",
    venue: "Sky Bar",
    action: "Purchased Bottle",
    details: "Black Label (750ml)",
    time: "2 mins ago",
  },
  {
    user: "Sarah Smith",
    venue: "Ocean Club",
    action: "Redemption",
    details: "60ml from Grey Goose",
    time: "15 mins ago",
  },
  {
    user: "Mike Johnson",
    venue: "High Spirits",
    action: "Redemption",
    details: "30ml from Glenfiddich",
    time: "1 hour ago",
  },
  {
    user: "Emma Wilson",
    venue: "The Vault",
    action: "Purchased Bottle",
    details: "Bombay Sapphire (750ml)",
    time: "2 hours ago",
  },
  {
    user: "Admin",
    venue: "System",
    action: "Venue Added",
    details: "Downtown Pub",
    time: "5 hours ago",
  },
]

import { adminService } from "@/services/api"

export function Dashboard() {
  const [stats, setStats] = React.useState({
    total_users: 0,
    total_venues: 0,
    total_bottles: 0,
    total_revenue: 0,
    total_redemptions: 0,
    bottles_sold: 0
  })

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch stats", error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_venues}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottles Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bottles_sold}</div>
            <p className="text-xs text-muted-foreground">₹{stats.total_revenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bottles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bottles}</div>
            <p className="text-xs text-muted-foreground">Inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_redemptions}</div>
            <p className="text-xs text-muted-foreground">Pegs redeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Bottles Sold</CardTitle>
            <CardDescription>Daily sales performance for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dataSold}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Redemptions by Venue</CardTitle>
            <CardDescription>Top performing venues this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dataRedemptions} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="total" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and system updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{activity.user}</TableCell>
                  <TableCell>{activity.venue}</TableCell>
                  <TableCell>
                    <Badge variant={activity.action === "Redemption" ? "secondary" : "outline"}>
                      {activity.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{activity.details}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{activity.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
