import ProcessQuery from "./components/ProcessQuery";
import PortQuery from "./components/PortQuery";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  {
    key: 'port',
    label: '端口查询',
    component: <PortQuery />,
  },
  {
    key: 'process',
    label: '进程查询',
    component: <ProcessQuery />,
  },

];

export default function ManagementPidPage() {
  return (
    <div className="flex flex-col pb-4 flex-1 overflow-hidden">
      <div className="shrink-0 px-4 border-b bg-white">
        <Tabs defaultValue={TABS[0].key} className="w-full">
          <TabsList>
            {TABS.map(t => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map(t => (
            <TabsContent key={t.key} value={t.key}>
              {t.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
