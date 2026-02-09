import * as React from "react"
import { Search, Filter, RefreshCw } from "lucide-react"
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

const redemptionsData = [
  { id: "R-1029", user: "Alice Johnson", bottle: "Black Label 12Y", peg: "30ml", status: "Served", bartender: "Bob Smith", time: "10 mins ago" },
  { id: "R-1030", user: "Evan Brown", bottle: "Grey Goose", peg: "60ml", status: "Pending", bartender: "-", time: "2 mins ago" },
  { id: "R-1031", user: "Charlie Davis", bottle: "Glenfiddich 12Y", peg: "30ml", status: "Served", bartender: "Bob Smith", time: "1 hour ago" },
  { id: "R-1032", user: "Dana Wilson", bottle: "Hennessy VS", peg: "45ml", status: "Expired", bartender: "-", time: "5 hours ago" },
  { id: "R-1033", user: "Alice Johnson", bottle: "Black Label 12Y", peg: "60ml", status: "Served", bartender: "Sarah Jones", time: "Yesterday" },
]

export function Redemptions() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Redemptions</h2>
        <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drink Requests</CardTitle>
          <CardDescription>Live feed of redemption requests and history.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search redemptions..."
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
                <Button variant="ghost" size="sm">Filter by Status</Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Bottle</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Served By</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptionsData.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell className="font-mono text-xs">{redemption.id}</TableCell>
                    <TableCell className="font-medium">{redemption.user}</TableCell>
                    <TableCell>{redemption.bottle}</TableCell>
                    <TableCell>{redemption.peg}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                            redemption.status === "Served" ? "bg-green-500 hover:bg-green-600" :
                            redemption.status === "Pending" ? "bg-yellow-500 hover:bg-yellow-600 text-black" :
                            "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {redemption.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{redemption.bartender}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{redemption.time}</TableCell>
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
