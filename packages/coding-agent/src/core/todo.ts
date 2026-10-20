export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoResult {
	items: TodoItem[];
	/** Set when the command could not be applied. */
	error?: string;
	/** Set when the list was cleared. */
	cleared?: boolean;
}

/**
 * Apply the argument of a `/todo` command to a list.
 * "" lists, "clear" empties, "done <n>" marks item n (1-based), anything else adds an item.
 * The input list is not mutated.
 */
export function applyTodoCommand(items: readonly TodoItem[], arg: string): TodoResult {
	const trimmed = arg.trim();
	const current = items.map((item) => ({ ...item }));

	if (trimmed === "clear") {
		return { items: [], cleared: true };
	}

	const doneMatch = /^done\s+(\d+)$/.exec(trimmed);
	if (doneMatch) {
		const item = current[Number(doneMatch[1]) - 1];
		if (!item) {
			return { items: current, error: `No todo item ${doneMatch[1]}` };
		}
		item.done = true;
		return { items: current };
	}

	if (trimmed) {
		current.push({ text: trimmed, done: false });
	}
	return { items: current };
}

export function formatTodoList(items: readonly TodoItem[]): string {
	const lines = items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`);
	return `Todo:\n${lines.join("\n")}`;
}
