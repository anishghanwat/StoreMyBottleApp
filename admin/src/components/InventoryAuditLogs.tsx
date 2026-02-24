import * as React from "react"
import { adminService } from "@/services/api"
import { Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { format } from "date-fns"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"

export function InventoryAuditLogs() {
  const [logs, setLogs] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [userFilter, setUserFilter] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState("")
  const [entityFilter, setEntityFilter] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  React.useEffect(() => {
    fetchLogs()
    fetchUsers()
  }, [userFilter, actionFilter, entityFilter, startDate, endDate])

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const filters: any = {}
      if (userFilter && userFilter !== "all") filters.user_id = userFilter
      if (actionFilter && actionFilter !== "all") filters.action = actionFilter
      if (entityFilter && entityFilter !== "all") filters.entity_type = entityFilter
      if (startDate) filters.start_date = new Date(startDate).toISOString()
      if (endDate) filters.end_date = new Date(endDate).toISOString()

      const data = await adminService.getAuditLogs(filters)
      setLogs(data.logs)
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error)
      toast.error(error.response?.data?.detail || "Failed to fetch audit logs")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers()
      setUsers(data.filter((u: any) => u.role === "admin" || u.role === "bartender"))
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const filteredLogs = logs.filter(log =>
    log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getActionBadge = (action: string) => {
    const variants: any = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      login: "outline",
      logout: "outline",
      view: "outline",
      approve: "default",
      reject: "destructive"
    }
    return <Badge variant={variants[action] || "outline"}>{action.toUpperCase()}</Badge>
  }

  const getEntityBadge = (entityType: string) => {
    const colors: any = {
      user: "bg-blue-100 text-blue-800",
      venue: "bg-green-100 text-green-800",
      bottle: "bg-purple-100 text-purple-800",
      purchase: "bg-yellow-100 text-yellow-800",
      redemption: "bg-orange-100 text-orange-800",
      bartender: "bg-pink-100 text-pink-800",
      promotion: "bg-indigo-100 text-indigo-800",
      ticket: "bg-red-100 text-red-800"
    }
    return <Badge className={colors[entityType] || ""}>{entityType}</Badge>
  }

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details", "IP Address"].join(","),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.user_name || "System",
        log.action,
        log.entity_type,
        log.entity_id || "",
        (log.details || "").replace(/,/g, ";"),
        log.ip_address || ""
      ].join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Audit logs exported successfully")
  }

  const userOptions = [
    { value: "all", label: "All Users" },
    ...users.map(user => ({ value: user.id, label: user.name }))
  ]

  const actionOptions = [
    { value: "all", label: "All Actions" },
    { value: "create", label: "Create" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "login", label: "Login" },
    { value: "logout", label: "Logout" },
    { value: "view", label: "View" },
    { value: "approve", label: "Approve" },
    { value: "reject", label: "Reject" }
  ]

  const entityOptions = [
    { value: "all", label: "All Entities" },
    { value: "user", label: "User" },
    { value: "venue", label: "Venue" },
    { value: "bottle", label: "Bottle" },
    { value: "purchase", label: "Purchase" },
    { value: "redemption", label: "Redemption" },
    { value: "bartender", label: "Bartender" },
    { value: "promotion", label: "Promotion" },
    { value: "ticket", label: "Support Ticket" }
  ]

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <Button onClick={exportLogs} variant="outline" disabled={filteredLogs.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <SearchFilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search logs..."
              filters={[
                {
                  id: "user",
                  label: "User",
                  value: userFilter || "all",
                  onChange: setUserFilter,
                  options: userOptions
                },
                {
                  id: "action",
                  label: "Action",
                  value: actionFilter || "all",
                  onChange: setActionFilter,
                  options: actionOptions
                },
                {
                  id: "entity",
                  label: "Entity",
                  value: entityFilter || "all",
                  onChange: setEntityFilter,
                  options: entityOptions
                }
              ]}
              onRefresh={() => fetchLogs(true)}
              refreshing={refreshing}
            >
              <Input
                type="date"
                className="w-[150px]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
              <Input
                type="date"
                className="w-[150px]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
            </SearchFilterBar>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeletonLoader columns={7} rows={10} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No audit logs found"
              description={searchQuery || userFilter || actionFilter || entityFilter ? "Try adjusting your filters" : "No activity has been logged yet"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>{log.user_name || "System"}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                    <TableCell className="font-mono text-xs">{log.entity_id || "-"}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{log.details || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
