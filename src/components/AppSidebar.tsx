import logo from "@/assets/logo.svg"
import { Home, Package, Search } from "lucide-react"
import { useLocation } from "react-router-dom"
import { Link } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Welcome",
    url: "/",
    icon: Home,
  },
  // {
  //   title: "发现",
  //   url: "/discover",
  //   icon: Search,
  // },
  // {
  //   title: "本地服务",
  //   url: "/installed",
  //   icon: Package,
  // },
  {
    title: "管理面板",
    url: "/management",
    icon: Package,
  },
  {
    title: "端口占用查询",
    url: "/management",
    icon: Package,
  },
  {
    title: "工具列表",
    url: "/management",
    icon: Package,
  },
]

export function AppSidebar() {
  const location = useLocation()
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <img src={logo} alt="MCP HTTP Server Logo" className="w-8 h-8" />
              <span className="font-bold text-lg">MCP HTTP</span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={isActive ? "bg-muted" : ""}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
