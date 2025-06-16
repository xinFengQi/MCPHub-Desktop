import React from "react";
import { X } from "lucide-react";

interface ListDisplayProps {
    items: string[];
    onSelect: (item: string) => void;
    onDelete?: (item: string) => void;
    emptyText?: React.ReactNode;
}

export const ListDisplay: React.FC<ListDisplayProps> = ({ items, onSelect, onDelete, emptyText }) => {
    if (items.length === 0) {
        return <div className="text-gray-400 px-4 py-6 text-center">{emptyText ?? "暂无数据"}</div>;
    }
    return (
        <ul>
            {items.map((item: string) => (
                <li
                    key={item}
                    className="group flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer truncate"
                    onClick={() => onSelect(item)}
                >
                    <span className="flex-1 truncate">{item}</span>
                    {onDelete && (
                        <button
                            className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            onClick={e => {
                                e.stopPropagation();
                                onDelete(item);
                            }}
                            title="删除"
                            type="button"
                        >
                            <X size={14} />
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}; 