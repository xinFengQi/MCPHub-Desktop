import { useState } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
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
import { invoke } from "@tauri-apps/api/core";

interface ProcessInfo {
    pid: number;
    status: string;
    cpu: string;
    mem: string;
    command: string;
}

const OPTIONS = [
    { label: 'node', value: 'node' },
];

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
    const [options, setOptions] = useState(OPTIONS);
    const [selected, setSelected] = useState(OPTIONS[0].value);
    const [processes, setProcesses] = useState<ProcessInfo[]>([]);
    const [loading, setLoading] = useState(false);

    // 输入框变化时，允许自定义输入
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        // 如果输入的内容不在options里，动态添加
        if (e.target.value && !options.find(opt => opt.value === e.target.value)) {
            setOptions([...OPTIONS, { label: e.target.value, value: e.target.value }]);
        }
    };

    // 选择下拉选项
    const handleSelectChange = (value: string) => {
        setSelected(value);
        setInput(value);
    };

    // 查询按钮点击
    const handleQuery = async () => {
        const keyword = input || selected;
        if (!keyword) return;

        setLoading(true);
        try {
            const processInfos = await invoke<ProcessInfo[]>("get_process_info_by_word", {
                keyword
            });
            console.log(processInfos)
            setProcesses(processInfos);
        } catch (error) {
            console.error('查询进程信息失败:', error);
            setProcesses([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* 固定的搜索区域 */}
            <div className="shrink-0 flex items-center gap-2 p-4 bg-white border-b">
                <input
                    className="border px-2 py-1 rounded w-48"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="请输入进程名"
                />
                <Select value={selected} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="选择进程" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <button
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    onClick={handleQuery}
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