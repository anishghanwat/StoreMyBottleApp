import * as React from "react"
import { Search, Filter, Calendar as CalendarIcon } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const purchasesData = [
  { id: "P-8832", user: "Alice Johnson", venue: "Sky Bar", bottle: "Black Label 12Y", status: "Paid", remaining: "750ml", date: "2023-10-25" },
  { id: "P-8833", user: "Evan Brown", venue: "Ocean Club", bottle: "Grey Goose", status: "Pending", remaining: "1000ml", date: "2023-10-24" },
  { id: "P-8834", user: "Charlie Davis", venue: "High Spirits", bottle: "Glenfiddich 12Y", status: "Paid", remaining: "350ml", date: "2023-10-23" },
  { id: "P-8835", user: "Alice Johnson", venue: "The Vault", bottle: "Bombay Sapphire", status: "Failed", remaining: "0ml", date: "2023-10-22" },
  { id: "P-8836", user: "Dana Wilson", venue: "Neon Lounge", bottle: "Hennessy VS", status: "Paid", remaining: "700ml", date: "2023-10-21" },
]

export function Purchases() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Purchase History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>View all bottle purchases made by users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search Transaction ID or User..."
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
                <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                    <CalendarIcon className="h-4 w-4" />
                </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Bottle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasesData.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono text-xs">{purchase.id}</TableCell>
                    <TableCell className="font-medium">{purchase.user}</TableCell>
                    <TableCell>{purchase.venue}</TableCell>
                    <TableCell>{purchase.bottle}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{purchase.date}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                            purchase.status === "Paid" ? "default" :
                            purchase.status === "Pending" ? "secondary" : "destructive"
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{purchase.remaining}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
