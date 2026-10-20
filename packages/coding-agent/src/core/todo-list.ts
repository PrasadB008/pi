export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoResult =
	| { kind: "list"; items: readonly TodoItem[] }
	| { kind: "added"; index: number; item: TodoItem }
	| { kind: "done"; item: TodoItem }
	| { kind: "cleared" }
	| { kind: "error"; message: string };

/** Apply the arguments of a `/todo` command to a list of items, mutating it. */
export function runTodoCommand(items: TodoItem[], args: string): TodoResult {
	const trimmed = args.trim();

	if (trimmed === "") {
		return { kind: "list", items };
	}

	if (trimmed === "clear") {
		items.length = 0;
		return { kind: "cleared" };
	}

	if (trimmed === "done" || trimmed.startsWith("done ")) {
		const match = /^done\s+(\d+)$/.exec(trimmed);
		if (!match) {
			return { kind: "error", message: "Usage: /todo done <n>" };
		}
		const item = items[Number(match[1]) - 1];
		if (!item) {
			return { kind: "error", message: `No todo item ${match[1]}` };
		}
		item.done = true;
		return { kind: "done", item };
	}

	const item: TodoItem = { text: trimmed, done: false };
	items.push(item);
	return { kind: "added", index: items.length, item };
}
