import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Settings() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and system preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your public profile and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" defaultValue="Admin User" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="admin@storemybottle.com" type="email" />
                </div>
            </CardContent>
            <CardFooter>
                <Button>Save Changes</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure global application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">Pilot Mode</Label>
                        <p className="text-sm text-muted-foreground">Restrict access to specific venues only.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <Separator />
                <div className="grid gap-2">
                    <Label htmlFor="qr-expiry">QR Redemption Code Expiry (Hours)</Label>
                    <Input id="qr-expiry" defaultValue="24" type="number" className="max-w-[200px]" />
                </div>
                <div className="grid gap-2">
                    <Label>Allowed Peg Sizes</Label>
                    <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="peg-30" defaultChecked />
                            <Label htmlFor="peg-30">30ml</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="peg-45" />
                            <Label htmlFor="peg-45">45ml</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="peg-60" defaultChecked />
                            <Label htmlFor="peg-60">60ml</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline">Reset Defaults</Button>
                <Button className="ml-auto">Update Configuration</Button>
            </CardFooter>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">Low Stock Alerts</Label>
                        <p className="text-sm text-muted-foreground">Receive emails when bottle stock is low.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                 <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">New User Signups</Label>
                        <p className="text-sm text-muted-foreground">Receive daily summary of new users.</p>
                    </div>
                    <Switch />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
