import * as React from "react"
import {
  LayoutDashboard,
  MapPin,
  Wine,
  Users,
  ShoppingBag,
  Ticket,
  UserCheck,
  Settings,
  Percent,
  MessageSquare,
  FileText,
  FileBarChart,
  BarChart3,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items
const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
  },
  {
    title: "Venues",
    icon: MapPin,
    id: "venues",
  },
  {
    title: "Bottles",
    icon: Wine,
    id: "bottles",
  },
  {
    title: "Users",
    icon: Users,
    id: "users",
  },
  {
    title: "Purchases",
    icon: ShoppingBag,
    id: "purchases",
  },
  {
    title: "Redemptions",
    icon: Ticket,
    id: "redemptions",
  },
  {
    title: "Bartenders",
    icon: UserCheck,
    id: "bartenders",
  },
  {
    title: "Reports",
    icon: FileBarChart,
    id: "reports",
  },
  {
    title: "Venue Analytics",
    icon: BarChart3,
    id: "venue-analytics",
  },
  {
    title: "Promotions",
    icon: Percent,
    id: "promotions",
  },
  // {
  //   title: "Support Tickets",
  //   icon: MessageSquare,
  //   id: "tickets",
  // },
  {
    title: "Audit Logs",
    icon: FileText,
    id: "logs",
  },
  {
    title: "Settings",
    icon: Settings,
    id: "settings",
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentPage: string
  onNavigate: (pageId: string) => void
}

export function AppSidebar({ currentPage, onNavigate, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wine className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">StoreMyBottle</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentPage === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
