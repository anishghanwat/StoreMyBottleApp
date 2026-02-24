import * as React from "react"
import { adminService } from "@/services/api"
import { Plus, MessageSquare, Send, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { TableSkeletonLoader } from "@/components/ui/skeleton-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatTimeAgo } from "@/lib/utils"

export function SupportTickets() {
  const [tickets, setTickets] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [selectedTicket, setSelectedTicket] = React.useState<any>(null)
  const [newComment, setNewComment] = React.useState("")
  const [formData, setFormData] = React.useState({
    subject: "",
    description: "",
    category: "general",
    priority: "medium"
  })

  const { confirm, dialog } = useConfirmDialog()

  React.useEffect(() => {
    fetchTickets()
    fetchUsers()
  }, [statusFilter, priorityFilter])

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const filters: any = {}
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter
      if (priorityFilter && priorityFilter !== "all") filters.priority = priorityFilter

      const data = await adminService.getTickets(filters)
      setTickets(data.tickets)
    } catch (error: any) {
      console.error("Failed to fetch tickets:", error)
      toast.error(error.response?.data?.detail || "Failed to fetch tickets")
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

  const handleCreate = () => {
    setFormData({
      subject: "",
      description: "",
      category: "general",
      priority: "medium"
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      await adminService.createTicket(formData)
      toast.success("Ticket created successfully")
      setIsDialogOpen(false)
      fetchTickets()
    } catch (error: any) {
      console.error("Failed to create ticket:", error)
      toast.error(error.response?.data?.detail || "Failed to create ticket")
    }
  }

  const handleViewDetails = async (ticket: any) => {
    try {
      const data = await adminService.getTicket(ticket.id)
      setSelectedTicket(data)
      setIsDetailOpen(true)
    } catch (error: any) {
      console.error("Failed to fetch ticket details:", error)
      toast.error(error.response?.data?.detail || "Failed to fetch ticket details")
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await adminService.updateTicket(ticketId, { status })
      toast.success("Status updated successfully")
      fetchTickets(true)
      if (selectedTicket?.id === ticketId) {
        const data = await adminService.getTicket(ticketId)
        setSelectedTicket(data)
      }
    } catch (error: any) {
      console.error("Failed to update status:", error)
      toast.error(error.response?.data?.detail || "Failed to update status")
    }
  }

  const handleAssign = async (ticketId: string, assignedToId: string) => {
    try {
      await adminService.updateTicket(ticketId, { assigned_to_id: assignedToId })
      toast.success("Ticket assigned successfully")
      fetchTickets(true)
    } catch (error: any) {
      console.error("Failed to assign ticket:", error)
      toast.error(error.response?.data?.detail || "Failed to assign ticket")
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return

    try {
      await adminService.addTicketComment(selectedTicket.id, {
        comment: newComment,
        is_internal: false
      })
      toast.success("Comment added successfully")
      setNewComment("")
      const data = await adminService.getTicket(selectedTicket.id)
      setSelectedTicket(data)
    } catch (error: any) {
      console.error("Failed to add comment:", error)
      toast.error(error.response?.data?.detail || "Failed to add comment")
    }
  }

  const handleDelete = async (id: string) => {
    confirm({
      title: "Delete Ticket",
      description: "Are you sure you want to delete this ticket? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await adminService.deleteTicket(id)
          toast.success("Ticket deleted successfully")
          fetchTickets()
          if (selectedTicket?.id === id) {
            setIsDetailOpen(false)
          }
        } catch (error: any) {
          console.error("Failed to delete ticket:", error)
          toast.error(error.response?.data?.detail || "Failed to delete ticket")
        }
      }
    })
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCount = tickets.filter(t => t.status === "open").length
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length
  const resolvedCount = tickets.filter(t => t.status === "resolved").length

  const getStatusBadge = (status: string) => {
    const variants: any = {
      open: "destructive",
      in_progress: "default",
      resolved: "secondary",
      closed: "outline"
    }
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ')}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors: any = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    }
    return <Badge className={colors[priority] || ""}>{priority}</Badge>
  }

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" }
  ]

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
  ]

  return (
    <div className="space-y-4 py-4">
      {dialog}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Tickets</h2>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tickets</CardTitle>
            <SearchFilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search tickets..."
              filters={[
                {
                  id: "status",
                  label: "Status",
                  value: statusFilter || "all",
                  onChange: setStatusFilter,
                  options: statusOptions
                },
                {
                  id: "priority",
                  label: "Priority",
                  value: priorityFilter || "all",
                  onChange: setPriorityFilter,
                  options: priorityOptions
                }
              ]}
              onRefresh={() => fetchTickets(true)}
              refreshing={refreshing}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeletonLoader columns={9} rows={5} />
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No tickets found"
              description={searchQuery || statusFilter || priorityFilter ? "Try adjusting your filters" : "Create your first support ticket"}
              action={!searchQuery && !statusFilter && !priorityFilter ? {
                label: "Create Ticket",
                onClick: handleCreate
              } : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer" onClick={() => handleViewDetails(ticket)}>
                    <TableCell className="font-mono font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{ticket.subject}</TableCell>
                    <TableCell>{ticket.user_name}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{ticket.assigned_to_name || "Unassigned"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket.comments_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(ticket)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "in_progress")}>
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "resolved")}>
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(ticket.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Create a new support ticket for a customer</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Textarea
                id="subject"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value: string) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="redemption">Redemption</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value: string) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedTicket.ticket_number}</DialogTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <DialogDescription>{selectedTicket.subject}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User:</span> {selectedTicket.user_name}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {selectedTicket.category}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatTimeAgo(selectedTicket.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Assigned To:</span>
                    <Select
                      value={selectedTicket.assigned_to_id || "unassigned"}
                      onValueChange={(value: string) => handleAssign(selectedTicket.id, value === "unassigned" ? "" : value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Comments ({selectedTicket.comments.length})</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {selectedTicket.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <Button onClick={handleAddComment} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
