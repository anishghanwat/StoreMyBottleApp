import * as React from "react"
import { Search, ShieldAlert, History, UserCog, Filter } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const auditLogsData = [
  {
    id: "LOG-9921",
    timestamp: "2024-02-14 14:32:10",
    user: "Admin (John Doe)",
    action: "Manual Stock Adjustment",
    details: "Removed 30ml from Bottle #123 (Grey Goose)",
    previousValue: "700ml",
    newValue: "670ml",
    severity: "Medium",
  },
  {
    id: "LOG-9920",
    timestamp: "2024-02-14 12:15:00",
    user: "System (Auto-Sync)",
    action: "Stock Sync",
    details: "Updated stock from POS integration",
    previousValue: "N/A",
    newValue: "Synced",
    severity: "Low",
  },
  {
    id: "LOG-9919",
    timestamp: "2024-02-14 09:45:22",
    user: "Bartender (Mike)",
    action: "Bottle Opening",
    details: "Opened Bottle #456 (Macallan 12)",
    previousValue: "Sealed",
    newValue: "Open",
    severity: "Low",
  },
  {
    id: "LOG-9918",
    timestamp: "2024-02-13 23:10:05",
    user: "Admin (John Doe)",
    action: "Price Override",
    details: "Changed price of 'Old Fashioned' from $15 to $12",
    previousValue: "$15.00",
    newValue: "$12.00",
    severity: "High",
  },
  {
    id: "LOG-9917",
    timestamp: "2024-02-13 18:00:00",
    user: "Manager (Sarah)",
    action: "Promo Activation",
    details: "Activated 'Happy Hour' promotion",
    previousValue: "Inactive",
    newValue: "Active",
    severity: "Medium",
  },
  {
    id: "LOG-9916",
    timestamp: "2024-02-13 15:30:45",
    user: "Admin (John Doe)",
    action: "User Ban",
    details: "Banned user user@example.com for violation",
    previousValue: "Active",
    newValue: "Banned",
    severity: "Critical",
  },
]

export function InventoryAuditLogs() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Audit Logs</h2>
          <p className="text-muted-foreground">
            Security-focused tracking of stock changes and sensitive actions.
          </p>
        </div>
        <Button variant="outline">
          <History className="mr-2 h-4 w-4" /> Export Logs
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Adjustments</CardTitle>
            <UserCog className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Stock manually changed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <History className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            <p className="text-xs text-muted-foreground">Logged this month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Log Entries</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-8 w-full md:w-[300px]" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogsData.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {log.timestamp}
                  </TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.details}>
                    {log.details}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">{log.previousValue}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">{log.newValue}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      log.severity === "Critical" ? "border-red-500 text-red-500 bg-red-50" :
                      log.severity === "High" ? "border-orange-500 text-orange-500 bg-orange-50" :
                      log.severity === "Medium" ? "border-yellow-500 text-yellow-600 bg-yellow-50" :
                      "text-muted-foreground"
                    }>
                      {log.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
