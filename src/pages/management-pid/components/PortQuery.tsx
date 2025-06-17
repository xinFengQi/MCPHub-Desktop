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
import { Button } from "@/components/ui/button";
import { getHistory, setHistory } from "@/utils/history";
import { ListDisplay } from "@/components/list/ListDisplay";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";

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

// 工具函数：校验端口输入
function isValidPortInput(val: string) {
    return val === '' || /^\d*$/.test(val);
}

// 工具函数：处理历史
function updateHistory(newItem: string, history: string[], key: string, max: number) {
    let newHistory = [newItem, ...history.filter(h => h !== newItem)];
    if (newHistory.length > max) newHistory = newHistory.slice(0, max);
    setHistory(newHistory, key, max);
    return newHistory;
}

// 工具函数：弹窗状态管理
function useConfirmDialogState() {
    const [open, setOpen] = useState(false);
    const [pendingId, setPendingId] = useState<number | null>(null);
    const openDialog = (id: number) => {
        setPendingId(id);
        setOpen(true);
    };
    const closeDialog = () => {
        setOpen(false);
        setPendingId(null);
    };
    return { open, pendingId, openDialog, closeDialog };
}

export default function PortQuery() {
    const [input, setInput] = useState('');
    const [ports, setPorts] = useState<PortInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistoryState] = useState<string[]>([]);
    const { open, pendingId, openDialog, closeDialog } = useConfirmDialogState();

    useEffect(() => {
        setHistoryState(getHistory(HISTORY_KEY));
        if (lastSearchPort) {
            setInput(lastSearchPort);
            handleQuery(lastSearchPort);
        }
    }, []);

    const handleQuery = async (keyword?: string) => {
        const searchWord = (keyword ?? input).trim();
        if (!searchWord || !/^\d+$/.test(searchWord)) {
            return;
        }
        setLoading(true);
        try {
            const portInfos = await invoke<PortInfo[]>("get_port_info_by_word", {
                keyword: searchWord
            });
            setPorts(portInfos);
            lastSearchPort = searchWord;
            const newHistory = updateHistory(searchWord, history, HISTORY_KEY, MAX_HISTORY);
            setHistoryState(newHistory);
        } catch (error) {
            setPorts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKillProcess = async (pid: number) => {
        try {
            await invoke("kill_process", { pid: pid.toString() });
            handleQuery();
        } catch (error) {
            console.error("Failed to kill process:", error);
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="shrink-0 flex items-center gap-2 p-4 bg-white border-b">
                <Input
                    value={input}
                    onChange={e => {
                        const val = e.target.value;
                        if (isValidPortInput(val)) {
                            setInput(val);
                        }
                    }}
                    placeholder="请输入端口号"
                    onKeyDown={e => { if (e.key === "Enter") handleQuery(); }}
                    endAdornment={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="p-1"
                                    tabIndex={-1}
                                    title="历史记录"
                                    type="button"
                                >
                                    <History size={18} />
                                </Button>
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
                <Button
                    variant="default"
                    onClick={() => handleQuery()}
                    disabled={loading || !input || !/^\d+$/.test(input)}
                >
                    {loading ? '查询中...' : '查询'}
                </Button>
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
                                    <TableHead className="w-32">本地地址</TableHead>
                                    <TableHead className="w-24">状态</TableHead>
                                    <TableHead className="w-24">操作</TableHead>
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
                                        <TableCell>
                                            <ConfirmDialog
                                                trigger={
                                                    <Button
                                                        className="px-0"
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => openDialog(port.pid)}
                                                    >
                                                        关闭进程
                                                    </Button>
                                                }
                                                title="确定要关闭该进程吗？"
                                                description={`PID: ${port.pid}, 进程: ${port.process}`}
                                                onConfirm={async () => {
                                                    if (pendingId !== null) {
                                                        await handleKillProcess(pendingId);
                                                        closeDialog();
                                                    }
                                                }}
                                                confirmText="确认"
                                                cancelText="取消"
                                                open={open && pendingId === port.pid}
                                                onOpenChange={o => {
                                                    if (!o) closeDialog();
                                                }}
                                            />
                                        </TableCell>
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