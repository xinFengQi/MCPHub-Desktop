import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { invoke } from "@tauri-apps/api/core";
import { History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getHistory, setHistory } from "@/utils/history";
import { ListDisplay } from "@/components/list/ListDisplay";

let lastSearchKeyword: string | null = null;

interface ProcessInfo {
    pid: number;
    status: string;
    cpu: string;
    mem: string;
    command: string;
}

const HISTORY_KEY = "process_query_history";
const MAX_HISTORY = 100;

// 进程状态码转换为中文
const getProcessStatusText = (status: string): string => {
    // macOS状态码转换
    const macStatusMap: { [key: string]: string } = {
        'R': '运行中',
        'S': '休眠中',
        'I': '空闲',
        'Z': '僵尸进程',
        'T': '已停止',
        'U': '等待中',
        'D': '不可中断',
    };

    // Windows状态转换
    const winStatusMap: { [key: string]: string } = {
        'Running': '运行中',
        'Suspended': '已暂停',
        'Not Responding': '无响应',
        'Unknown': '未知',
    };

    // 处理macOS的组合状态码（如'Ss'、'R+'等）
    const baseStatus = status.charAt(0);
    const macStatus = macStatusMap[baseStatus];
    if (macStatus) return macStatus;

    // 处理Windows状态
    const winStatus = winStatusMap[status];
    if (winStatus) return winStatus;

    // 未知状态则返回原始值
    return status;
};

// 获取命令的最后一部分
const getShortCommand = (command: string) => {
    // 移除路径中的引号（如果有）
    const cleanCommand = command.replace(/["']/g, '');

    // 查找第一个参数标记（以 - 或 -- 开头）的位置
    const argIndex = cleanCommand.search(/\s-{1,2}[a-zA-Z]/);

    // 分离主命令和参数
    const mainCommand = argIndex === -1 ? cleanCommand : cleanCommand.slice(0, argIndex);
    const args = argIndex === -1 ? '' : cleanCommand.slice(argIndex);

    // 获取主命令的最后一段
    const baseCommand = mainCommand.split(/[\/\\]/).pop() || '';

    // 如果原始命令包含路径分隔符，添加...前缀
    const prefix = (mainCommand.includes('/') || mainCommand.includes('\\')) ? '...' : '';

    return args ? `${prefix}${baseCommand}${args}` : baseCommand;
};

export default function ProcessQuery() {
    const [input, setInput] = useState('');
    const [processes, setProcesses] = useState<ProcessInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistoryState] = useState<string[]>([]);

    useEffect(() => {
        setHistoryState(getHistory(HISTORY_KEY));
        // 如果有上次的搜索关键词，自动触发查询
        if (lastSearchKeyword) {
            setInput(lastSearchKeyword);
            handleQuery(lastSearchKeyword);
        }
    }, []);

    const handleQuery = async (keyword?: string) => {
        const searchWord = (keyword ?? input).trim();
        if (!searchWord) return;
        setLoading(true);
        try {
            const processInfos = await invoke<ProcessInfo[]>("get_process_info_by_word", {
                keyword: searchWord
            });
            setProcesses(processInfos);
            // 保存本次搜索关键词
            lastSearchKeyword = searchWord;
            // 写入历史
            let newHistory = [searchWord, ...history.filter(h => h !== searchWord)];
            if (newHistory.length > MAX_HISTORY) newHistory = newHistory.slice(0, MAX_HISTORY);
            setHistory(newHistory, HISTORY_KEY, MAX_HISTORY);
            setHistoryState(newHistory);
        } catch (error) {
            setProcesses([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* 搜索区域 */}
            <div className="shrink-0 flex items-center gap-2 p-4 bg-white border-b">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="请输入进程名"
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
                    disabled={loading}
                >
                    {loading ? '查询中...' : '查询'}
                </button>
            </div>
            {/* 表格区域 */}
            <div className="flex-1 overflow-auto">
                {processes.length === 0 ? (
                    <div className="text-gray-400 text-center p-4">暂无数据</div>
                ) : (
                    <div className="relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                    <TableHead className="w-24">PID</TableHead>
                                    <TableHead className="w-24">状态</TableHead>
                                    <TableHead className="w-24">CPU</TableHead>
                                    <TableHead className="w-24">内存</TableHead>
                                    <TableHead className="w-[300px]">命令</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processes.map((process, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{process.pid}</TableCell>
                                        <TableCell>{getProcessStatusText(process.status)}</TableCell>
                                        <TableCell>{process.cpu}%</TableCell>
                                        <TableCell>{process.mem}%</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="w-[300px] truncate">
                                                            {getShortCommand(process.command)}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-[500px] break-all">{process.command}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
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