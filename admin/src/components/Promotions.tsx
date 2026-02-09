import * as React from "react"
import { Plus, Search, MoreHorizontal, Tag, Calendar, Percent, Copy } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const promotionsData = [
  {
    id: "PROMO-001",
    code: "WELCOME20",
    description: "20% off for first-time users",
    type: "Percentage",
    value: "20%",
    validUntil: "2024-12-31",
    usageCount: 145,
    status: "Active",
  },
  {
    id: "PROMO-002",
    code: "SUMMER50",
    description: "Flat $50 off on premium bottles",
    type: "Fixed Amount",
    value: "$50.00",
    validUntil: "2024-08-31",
    usageCount: 89,
    status: "Active",
  },
  {
    id: "PROMO-003",
    code: "HAPPYHOUR",
    description: "Happy Hour: 15% off all drinks",
    type: "Percentage",
    value: "15%",
    validUntil: "2024-12-31",
    usageCount: 320,
    status: "Active",
  },
  {
    id: "PROMO-004",
    code: "VIPACCESS",
    description: "Exclusive bundle for VIP members",
    type: "Bundle",
    value: "N/A",
    validUntil: "2024-10-15",
    usageCount: 12,
    status: "Expired",
  },
  {
    id: "PROMO-005",
    code: "FREESHOT",
    description: "One free shot with any bottle purchase",
    type: "Gift",
    value: "1 Shot",
    validUntil: "2024-11-30",
    usageCount: 56,
    status: "Scheduled",
  },
]

export function Promotions() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Promotions & Offers</h2>
          <p className="text-muted-foreground">
            Manage discount codes, happy hours, and special bundles.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Promotion
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Currently running campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">622</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Scheduled to start soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Promotions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search promotions..." className="pl-8 w-[250px]" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotionsData.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                  <TableCell>{promo.description}</TableCell>
                  <TableCell>{promo.type}</TableCell>
                  <TableCell>{promo.value}</TableCell>
                  <TableCell>{promo.validUntil}</TableCell>
                  <TableCell>{promo.usageCount}</TableCell>
                  <TableCell>
                    <Badge variant={promo.status === "Active" ? "default" : promo.status === "Expired" ? "destructive" : "secondary"}>
                      {promo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" /> Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
