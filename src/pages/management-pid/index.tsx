import { useState } from "react";
import ProcessQuery from "./components/ProcessQuery";
import PortQuery from "./components/PortQuery";

const TABS = [
  {
    key: 'process',
    label: '进程查询',
    component: <ProcessQuery />,
  },
  {
    key: 'port',
    label: '端口查询',
    component: <PortQuery />,
  },
];

export default function ManagementPidPage() {
  const [tab, setTab] = useState(TABS[0].key);
  const currentTab = TABS.find(t => t.key === tab);

  return (
    <div className="flex flex-col pb-4 flex-1 overflow-hidden" >
      {/* 固定的头部区域 */}
      <div className="shrink-0 px-4 border-b bg-white">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`px-4 py-2 -mb-px border-b-2 ${tab === t.key
                ? 'border-blue-500 text-blue-600 font-bold'
                : 'border-transparent text-gray-500'
                } ${t !== TABS[0] ? 'ml-4' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentTab?.component}
      </div>
    </div>
  );
}
