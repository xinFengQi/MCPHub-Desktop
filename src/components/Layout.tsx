import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { useEffect, useState, createContext, useContext } from "react";
import { listen } from "@tauri-apps/api/event";

// 全局 context
const CmdOutputContext = createContext<string[]>([]);

export function Layout() {
  const [cmdLines, setCmdLines] = useState<string[]>([]);

  useEffect(() => {
    const unlisten = listen<string>("cmd_output", e => {
      setCmdLines(lines => [...lines, e.payload]);
    });
    const unlistenErr = listen<string>("cmd_output_err", e => {
      setCmdLines(lines => [...lines, `[stderr] ${e.payload}`]);
    });
    return () => {
      unlisten.then(f => f());
      unlistenErr.then(f => f());
    };
  }, []);

  return (
    <SidebarProvider>
      <CmdOutputContext.Provider value={cmdLines}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <main className="flex-1 min-w-0 overflow-auto">
            <div className="p-4 flex items-center gap-2">
              <SidebarTrigger />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="命令行输出">
                    <Terminal />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>命令行输出</DialogTitle>
                  <CmdOutputViewer />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex-1 min-w-0 px-6">
              <Outlet />
            </div>
          </main>
        </div>
      </CmdOutputContext.Provider>
    </SidebarProvider>
  )
}

function CmdOutputViewer() {
  const lines = useContext(CmdOutputContext);
  return (
    <div className="max-h-96 overflow-auto font-mono text-xs bg-black text-green-400 p-2 rounded">
      {lines.length === 0 ? <div className="text-gray-400">暂无输出</div> : lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}