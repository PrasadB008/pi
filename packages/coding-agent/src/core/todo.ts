export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	items: TodoItem[];
	/** Set when the arguments were invalid; items are unchanged. */
	error?: string;
	/** Set when the list was cleared. */
	cleared?: boolean;
}

/**
 * Apply the arguments of `/todo` to a list.
 * "" shows the list, "clear" empties it, "done <n>" marks item n (1-based) done, anything else adds an item.
 */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (trimmed === "clear") {
		return { items: [], cleared: true };
	}
	const doneMatch = /^done\s+(\d+)$/.exec(trimmed);
	if (doneMatch) {
		const index = Number(doneMatch[1]) - 1;
		if (index < 0 || index >= items.length) {
			return { items: [...items], error: `No todo item ${doneMatch[1]}` };
		}
		return { items: items.map((item, i) => (i === index ? { ...item, done: true } : item)) };
	}
	if (trimmed) {
		return { items: [...items, { text: trimmed, done: false }] };
	}
	return { items: [...items] };
}

/** Format items as "1. [ ] text" lines. */
export function formatTodoLines(items: readonly TodoItem[]): string[] {
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`);
}
