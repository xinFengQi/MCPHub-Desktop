import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { CmdOutputButton } from "@/components/log/CmdOutput";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-hidden h-full flex flex-col">
          <div className="p-4 flex items-center gap-2">
            <SidebarTrigger />
            <CmdOutputButton />
          </div>
          <div className="flex-1 min-w-0 px-6 pb-4 flex flex-col overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}