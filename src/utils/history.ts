const DEFAULT_KEY = "process_query_history";
const DEFAULT_MAX = 100;

export function getHistory(key: string = DEFAULT_KEY): string[] {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function setHistory(list: string[], key: string = DEFAULT_KEY, max: number = DEFAULT_MAX) {
    localStorage.setItem(key, JSON.stringify(list.slice(0, max)));
} 