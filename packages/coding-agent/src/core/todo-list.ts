export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	items: TodoItem[];
	/** Text to show to the user. For "list" results this is the formatted list. */
	message: string;
	kind: "list" | "status" | "warning";
}

export function formatTodoList(items: readonly TodoItem[]): string {
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

/**
 * Apply the arguments of `/todo` to a todo list. Never mutates the input list.
 *
 * - `` (empty): list items
 * - `clear`: remove all items
 * - `done <n>` / `rm <n>`: mark item n (1-based) done / remove it
 * - anything else: add it as a new item
 */
export function runTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const current = items.map((item) => ({ ...item }));
	const input = args.trim();

	if (!input) {
		if (current.length === 0) {
			return { items: current, message: "No todos. Add one with /todo <text>", kind: "status" };
		}
		return { items: current, message: formatTodoList(current), kind: "list" };
	}

	if (input === "clear") {
		return { items: [], message: "Todo list cleared", kind: "status" };
	}

	const indexMatch = /^(done|rm)\s+(\d+)$/.exec(input);
	if (indexMatch) {
		const index = Number.parseInt(indexMatch[2], 10) - 1;
		const item = current[index];
		if (!item) {
			return { items: current, message: `No todo number ${indexMatch[2]}`, kind: "warning" };
		}
		if (indexMatch[1] === "done") {
			item.done = true;
			return { items: current, message: `Done: ${item.text}`, kind: "status" };
		}
		current.splice(index, 1);
		return { items: current, message: `Removed: ${item.text}`, kind: "status" };
	}

	if (input === "done" || input === "rm") {
		return { items: current, message: `Usage: /todo ${input} <n>`, kind: "warning" };
	}

	current.push({ text: input, done: false });
	return { items: current, message: `Added todo ${current.length}: ${input}`, kind: "status" };
}
