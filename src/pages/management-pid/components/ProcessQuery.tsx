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
    user: string;
    cpu: string;
    mem: string;
    command: string;
}

const OPTIONS = [
    { label: 'node', value: 'node' },
];

// 获取命令的最后一部分
const getShortCommand = (command: string) => {
    // 移除路径中的引号（如果有）
    const cleanCommand = command.replace(/["']/g, '');
    // 按空格分割，获取所有部分
    const parts = cleanCommand.split(' ');
    // 获取基础命令（第一个部分）的最后一段路径
    const baseCommand = parts[0].split(/[\/\\]/).pop() || '';
    // 如果有参数，添加前两个参数，其余用...表示
    if (parts.length > 1) {
        const args = parts.slice(1, 3).join(' ');
        return parts.length > 3 ? `${baseCommand} ${args}...` : `${baseCommand} ${args}`;
    }
    return baseCommand;
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
                                    <TableHead className="w-32">用户</TableHead>
                                    <TableHead className="w-24">CPU</TableHead>
                                    <TableHead className="w-24">内存</TableHead>
                                    <TableHead>命令</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processes.map((process, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{process.pid}</TableCell>
                                        <TableCell>{process.user}</TableCell>
                                        <TableCell>{process.cpu}%</TableCell>
                                        <TableCell>{process.mem}%</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="text-left">
                                                        {getShortCommand(process.command)}
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