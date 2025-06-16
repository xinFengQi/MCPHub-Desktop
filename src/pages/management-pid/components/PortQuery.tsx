import { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { invoke } from "@tauri-apps/api/core";
import { History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getHistory, setHistory } from "@/utils/history";
import { ListDisplay } from "@/components/list/ListDisplay";

let lastSearchPort: string | null = null;

interface PortInfo {
    port: number;
    pid: number;
    process: string;
    protocol: string;
    local_addr: string;
    status: string;
}

const HISTORY_KEY = "port_query_history";
const MAX_HISTORY = 100;

export default function PortQuery() {
    const [input, setInput] = useState('');
    const [ports, setPorts] = useState<PortInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistoryState] = useState<string[]>([]);

    useEffect(() => {
        setHistoryState(getHistory(HISTORY_KEY));
        // 如果有上次的搜索端口，自动触发查询
        if (lastSearchPort) {
            setInput(lastSearchPort);
            handleQuery(lastSearchPort);
        }
    }, []);

    const handleQuery = async (keyword?: string) => {
        const searchWord = (keyword ?? input).trim();
        // 空字符串或纯数字
        if (!searchWord || !/^\d+$/.test(searchWord)) {
            return;
        }
        setLoading(true);
        try {
            const portInfos = await invoke<PortInfo[]>("get_port_info_by_word", {
                keyword: searchWord
            });
            setPorts(portInfos);
            // 保存本次搜索端口
            lastSearchPort = searchWord;
            let newHistory = [searchWord, ...history.filter(h => h !== searchWord)];
            if (newHistory.length > MAX_HISTORY) newHistory = newHistory.slice(0, MAX_HISTORY);
            setHistory(newHistory, HISTORY_KEY, MAX_HISTORY);
            setHistoryState(newHistory);
        } catch (error) {
            setPorts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="shrink-0 flex items-center gap-2 p-4 bg-white border-b">
                <Input
                    value={input}
                    onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) {
                            setInput(val);
                        }
                    }}
                    placeholder="请输入端口号"
                    onKeyDown={e => { if (e.key === "Enter") handleQuery(); }}
                    endAdornment={
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="p-1 hover:bg-gray-100 rounded"
                                    tabIndex={-1}
                                    title="历史记录"
                                    type="button"
                                >
                                    <History size={18} />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-64 max-h-64 overflow-y-auto">
                                <div className="text-sm font-bold px-4 py-2 border-b">历史搜索</div>
                                <ListDisplay
                                    items={history}
                                    onSelect={(item: string) => {
                                        setInput(item);
                                        handleQuery(item);
                                    }}
                                    onDelete={(item: string) => {
                                        const newHistory = history.filter(h => h !== item);
                                        setHistory(newHistory, HISTORY_KEY, MAX_HISTORY);
                                        setHistoryState(newHistory);
                                    }}
                                    emptyText="暂无历史"
                                />
                            </PopoverContent>
                        </Popover>
                    }
                    className="w-48"
                />
                <button
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    onClick={() => handleQuery()}
                    disabled={loading || !input || !/^\d+$/.test(input)}
                >
                    {loading ? '查询中...' : '查询'}
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {ports.length === 0 ? (
                    <div className="text-gray-400 text-center p-4">暂无数据</div>
                ) : (
                    <div className="relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                    <TableHead className="w-24">端口</TableHead>
                                    <TableHead className="w-24">PID</TableHead>
                                    <TableHead className="w-32">进程</TableHead>
                                    <TableHead className="w-24">协议</TableHead>
                                    <TableHead className="w-64">本地地址</TableHead>
                                    <TableHead className="w-24">状态</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ports.map((port, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{port.port}</TableCell>
                                        <TableCell>{port.pid}</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="w-32 truncate">{port.process}</div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-[300px] break-all">{port.process}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>{port.protocol}</TableCell>
                                        <TableCell>{port.local_addr}</TableCell>
                                        <TableCell>{port.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
} 