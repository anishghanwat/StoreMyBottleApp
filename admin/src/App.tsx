import * as React from "react"
import { AppSidebar } from "@/components/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dashboard } from "@/components/Dashboard"
import { Venues } from "@/components/Venues"
import { Bottles } from "@/components/Bottles"
import { Users } from "@/components/Users"
import { Purchases } from "@/components/Purchases"
import { Redemptions } from "@/components/Redemptions"
import { Bartenders } from "@/components/Bartenders"
import { Reports } from "@/components/Reports"
import { VenueAnalytics } from "@/components/VenueAnalytics"
import { Settings } from "@/components/Settings"
import { Promotions } from "@/components/Promotions"
// import { SupportTickets } from "@/components/SupportTickets"
import { InventoryAuditLogs } from "@/components/InventoryAuditLogs"
import { Login } from "@/components/Login"
import { authService } from "@/services/api"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  const [currentPage, setCurrentPage] = React.useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Check auth status on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token')
      const storedUser = localStorage.getItem('admin_user')

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          // Verify user is admin
          if (parsedUser.role === 'admin') {
            setIsAuthenticated(true)
            setUser(parsedUser)
          } else {
            // Not an admin, clear storage
            authService.logout()
          }
        } catch (e) {
          // Invalid stored data, clear it
          authService.logout()
        }
      }

      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleLogin = (user: any) => {
    setIsAuthenticated(true)
    setUser(user)
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "venues":
        return <Venues />
      case "bottles":
        return <Bottles />
      case "users":
        return <Users />
      case "purchases":
        return <Purchases />
      case "redemptions":
        return <Redemptions />
      case "bartenders":
        return <Bartenders />
      case "reports":
        return <Reports />
      case "venue-analytics":
        return <VenueAnalytics />
      case "settings":
        return <Settings />
      case "promotions":
        return <Promotions />
      // case "tickets":
      //   return <SupportTickets />
      case "logs":
        return <InventoryAuditLogs />
      default:
        return <Dashboard />
    }
  }

  const getPageTitle = () => {
    return currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 justify-between bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="font-semibold">{getPageTitle()}</span>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">{user?.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "admin@storemybottle.com"}</p>
                  </div>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}`} alt="@admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-muted/10 min-h-[calc(100vh-4rem)]">
          {renderPage()}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
