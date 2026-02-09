import * as React from "react"
import { Search, Filter, MoreHorizontal } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

const bottlesData = [
  { id: "B001", name: "Black Label 12Y", brand: "Johnnie Walker", venue: "Sky Bar", price: "$120", totalMl: 750, status: "Available" },
  { id: "B002", name: "Grey Goose Original", brand: "Grey Goose", venue: "Ocean Club", price: "$150", totalMl: 1000, status: "Low Stock" },
  { id: "B003", name: "Glenfiddich 12Y", brand: "Glenfiddich", venue: "High Spirits", price: "$180", totalMl: 750, status: "Available" },
  { id: "B004", name: "Bombay Sapphire", brand: "Bombay", venue: "The Vault", price: "$90", totalMl: 750, status: "Out of Stock" },
  { id: "B005", name: "Hennessy VS", brand: "Hennessy", venue: "Neon Lounge", price: "$200", totalMl: 700, status: "Available" },
]

export function Bottles() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bottles Inventory</h2>
        <div className="flex gap-2">
           <Button variant="outline">Bulk Import</Button>
           <Button>Add Bottle</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bottle List</CardTitle>
          <CardDescription>Manage bottle inventory across all venues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bottles..."
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="secondary" size="sm" className="h-9">
                Bulk Disable
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Bottle Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottlesData.map((bottle) => (
                  <TableRow key={bottle.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium">
                      {bottle.name}
                      <span className="block text-xs text-muted-foreground md:hidden">{bottle.brand}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{bottle.brand}</TableCell>
                    <TableCell>{bottle.venue}</TableCell>
                    <TableCell>{bottle.totalMl}ml</TableCell>
                    <TableCell>{bottle.price}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          bottle.status === "Available" ? "default" : 
                          bottle.status === "Out of Stock" ? "destructive" : "secondary"
                        }
                      >
                        {bottle.status}
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
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem>Update Stock</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Disable</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
