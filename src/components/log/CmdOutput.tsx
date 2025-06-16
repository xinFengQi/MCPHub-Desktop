import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useToast } from "@/hooks/use-toast";

// 创建全局 context
export const useCmdOutput = () => {
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

    const clearLogs = () => {
        setCmdLines([]);
    };

    return { cmdLines, clearLogs };
};

interface HighlightedTextProps {
    text: string;
    searchTerm: string;
    isCurrentMatch?: boolean;
}

const HighlightedText = ({ text, searchTerm, isCurrentMatch = false }: HighlightedTextProps) => {
    if (!searchTerm) return <>{text}</>;

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
        <>
            {parts.map((part, i) => {
                const isMatch = part.toLowerCase() === searchTerm.toLowerCase();
                return isMatch ? (
                    <span
                        key={i}
                        className={`${isCurrentMatch ? 'bg-yellow-500' : 'bg-yellow-500/50'}`}
                    >
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                );
            })}
        </>
    );
};

export function CmdOutputButton() {
    const { cmdLines, clearLogs } = useCmdOutput();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="命令行输出">
                    <Terminal />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
                <DialogTitle>命令行输出</DialogTitle>
                <CmdOutputViewer lines={cmdLines} onClear={clearLogs} />
            </DialogContent>
        </Dialog>
    );
}

interface CmdOutputViewerProps {
    lines: string[];
    onClear: () => void;
}

function CmdOutputViewer({ lines, onClear }: CmdOutputViewerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [matchedLines, setMatchedLines] = useState<Array<{ index: number; line: string }>>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const { toast } = useToast();

    // 更新搜索结果
    useEffect(() => {
        if (!searchTerm) {
            setMatchedLines([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const matched = lines.map((line, index) => ({
            index,
            line,
            matches: line.toLowerCase().includes(searchTerm.toLowerCase())
        })).filter(item => item.matches);

        setMatchedLines(matched);
        setCurrentMatchIndex(matched.length > 0 ? 0 : -1);
    }, [searchTerm, lines]);

    // 滚动到当前匹配项
    useEffect(() => {
        if (currentMatchIndex >= 0 && containerRef.current) {
            const elements = containerRef.current.getElementsByClassName('bg-yellow-500');
            if (elements.length > 0) {
                elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentMatchIndex]);

    const handleCopy = () => {
        navigator.clipboard.writeText(lines.join('\n'));
        toast({
            title: "复制成功",
            description: (
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>已复制到剪贴板</span>
                </div>
            ),
            duration: 1500,
        });
    };

    const handleClear = () => {
        if (window.confirm('确定要清除所有日志吗？')) {
            onClear();
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handlePrevMatch = () => {
        if (matchedLines.length === 0) return;
        setCurrentMatchIndex(prev =>
            prev > 0 ? prev - 1 : matchedLines.length - 1
        );
    };

    const handleNextMatch = () => {
        if (matchedLines.length === 0) return;
        setCurrentMatchIndex(prev =>
            prev < matchedLines.length - 1 ? prev + 1 : 0
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                handlePrevMatch();
            } else {
                handleNextMatch();
            }
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <Input
                        placeholder="搜索日志... (Enter: 下一个, Shift+Enter: 上一个)"
                        value={searchTerm}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        endAdornment={
                            searchTerm ? (
                                <div className="flex items-center gap-0.5">
                                    <button
                                        className="p-1 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
                                        onClick={handlePrevMatch}
                                        disabled={matchedLines.length === 0}
                                        title="上一个匹配项 (Shift+Enter)"
                                        type="button"
                                    >
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        className="p-1 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
                                        onClick={handleNextMatch}
                                        disabled={matchedLines.length === 0}
                                        title="下一个匹配项 (Enter)"
                                        type="button"
                                    >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : null
                        }
                    />
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopy} title="复制全部">
                    <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClear} title="清除全部">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div
                ref={containerRef}
                className="h-[60vh] overflow-y-auto overflow-x-hidden font-mono text-xs bg-black text-green-400 p-2 rounded whitespace-pre-wrap"
            >
                {lines.length === 0 ? (
                    <div className="text-gray-400">暂无输出</div>
                ) : (
                    lines.map((line, i) => {
                        const isCurrentMatch = matchedLines[currentMatchIndex]?.index === i;
                        return (
                            <div key={i} className="break-all">
                                <HighlightedText
                                    text={line}
                                    searchTerm={searchTerm}
                                    isCurrentMatch={isCurrentMatch}
                                />
                            </div>
                        );
                    })
                )}
            </div>
            {searchTerm && matchedLines.length > 0 && (
                <div className="text-sm text-gray-500">
                    当前第 {currentMatchIndex + 1} 行匹配项，共 {matchedLines.length} 行
                </div>
            )}
        </div>
    );
} 