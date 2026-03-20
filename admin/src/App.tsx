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
import { authService } from "@/services/api"
import { Toaster } from "@/components/ui/sonner"

const Dashboard = React.lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })))
const Venues = React.lazy(() => import("@/components/Venues").then(m => ({ default: m.Venues })))
const Bottles = React.lazy(() => import("@/components/Bottles").then(m => ({ default: m.Bottles })))
const Users = React.lazy(() => import("@/components/Users").then(m => ({ default: m.Users })))
const Purchases = React.lazy(() => import("@/components/Purchases").then(m => ({ default: m.Purchases })))
const Redemptions = React.lazy(() => import("@/components/Redemptions").then(m => ({ default: m.Redemptions })))
const Bartenders = React.lazy(() => import("@/components/Bartenders").then(m => ({ default: m.Bartenders })))
const Reports = React.lazy(() => import("@/components/Reports").then(m => ({ default: m.Reports })))
const VenueAnalytics = React.lazy(() => import("@/components/VenueAnalytics").then(m => ({ default: m.VenueAnalytics })))
const Settings = React.lazy(() => import("@/components/Settings").then(m => ({ default: m.Settings })))
const Promotions = React.lazy(() => import("@/components/Promotions").then(m => ({ default: m.Promotions })))
const SupportTickets = React.lazy(() => import("@/components/SupportTickets").then(m => ({ default: m.SupportTickets })))
const InventoryAuditLogs = React.lazy(() => import("@/components/InventoryAuditLogs").then(m => ({ default: m.InventoryAuditLogs })))
const Login = React.lazy(() => import("@/components/Login").then(m => ({ default: m.Login })))
const ForgotPassword = React.lazy(() => import("@/components/ForgotPassword").then(m => ({ default: m.ForgotPassword })))
const ResetPassword = React.lazy(() => import("@/components/ResetPassword").then(m => ({ default: m.ResetPassword })))

export default function App() {
  const [currentPage, setCurrentPage] = React.useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [authView, setAuthView] = React.useState<'login' | 'forgot-password' | 'reset-password'>('login')
  const [resetToken, setResetToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Check for reset token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setAuthView('reset-password')
      setResetToken(token)
    }

    // Check for hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'forgot-password') {
        setAuthView('forgot-password')
      } else if (hash === 'login' || hash === '') {
        setAuthView('login')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

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
    setAuthView('login')
    window.location.hash = ''
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
    setAuthView('login')
    window.location.hash = ''
  }

  const handleBackToLogin = () => {
    setAuthView('login')
    window.location.hash = ''
  }

  const handleResetSuccess = () => {
    setAuthView('login')
    setResetToken(null)
    window.location.hash = ''
    window.history.replaceState({}, document.title, window.location.pathname)
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
      case "tickets":
        return <SupportTickets />
      case "logs":
        return <InventoryAuditLogs />
      default:
        return <Dashboard />
    }
  }

  const getPageTitle = () => {
    const pageTitles: Record<string, string> = {
      dashboard: "Dashboard",
      venues: "Venues",
      bottles: "Bottles",
      users: "Users",
      purchases: "Purchases",
      redemptions: "Redemptions",
      bartenders: "Bartenders",
      reports: "Reports",
      "venue-analytics": "Venue Analytics",
      settings: "Settings",
      promotions: "Promotions",
      tickets: "Support Tickets",
      logs: "Audit Logs",
    }
    return pageTitles[currentPage] ?? currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        {authView === 'login' && <Login onLogin={handleLogin} />}
        {authView === 'forgot-password' && <ForgotPassword onBack={handleBackToLogin} />}
        {authView === 'reset-password' && resetToken && (
          <ResetPassword
            token={resetToken}
            onSuccess={handleResetSuccess}
            onBack={handleBackToLogin}
          />
        )}
        <Toaster />
      </React.Suspense>
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
                <DropdownMenuItem onClick={() => setCurrentPage('settings')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage('settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-muted/10 min-h-[calc(100vh-4rem)]">
          <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>}>
            {renderPage()}
          </React.Suspense>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
