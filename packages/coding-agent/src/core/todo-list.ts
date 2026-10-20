export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoCommandResult = { ok: true; items: TodoItem[]; notice?: string } | { ok: false; error: string };

/**
 * Apply the arguments of a `/todo` command to a list and return the new list.
 * The input list is never mutated.
 *
 * - "" lists the items (list unchanged)
 * - "clear" empties the list
 * - "done <n>" marks item n (1-based) as done
 * - "rm <n>" removes item n (1-based)
 * - anything else is added as a new item
 */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed) {
		return { ok: true, items: items.map((item) => ({ ...item })) };
	}
	if (trimmed === "clear") {
		return { ok: true, items: [], notice: "Todo list cleared" };
	}

	const match = /^(done|rm)(?:\s+(.*))?$/.exec(trimmed);
	if (match) {
		const command = match[1];
		const value = (match[2] ?? "").trim();
		const number = Number(value);
		if (!/^\d+$/.test(value) || number < 1 || number > items.length) {
			return { ok: false, error: `Usage: /todo ${command} <n> (n between 1 and ${items.length})` };
		}
		const index = number - 1;
		if (command === "done") {
			return { ok: true, items: items.map((item, i) => ({ ...item, done: item.done || i === index })) };
		}
		return { ok: true, items: items.filter((_, i) => i !== index).map((item) => ({ ...item })) };
	}

	return { ok: true, items: [...items.map((item) => ({ ...item })), { text: trimmed, done: false }] };
}

export function formatTodoList(items: readonly TodoItem[]): string[] {
	return items.map((item, index) => `${index + 1}. ${item.done ? "[x]" : "[ ]"} ${item.text}`);
}
