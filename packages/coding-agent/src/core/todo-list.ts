export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	items: TodoItem[];
	action: "list" | "add" | "done" | "clear";
	error?: string;
}

/**
 * Apply the arguments of a `/todo` command to a list and return the new list.
 * The input list is never mutated.
 *
 * - `""` lists the items
 * - `clear` empties the list
 * - `done <n>` marks the 1-based item `n` as done
 * - anything else is added as a new item
 */
export function applyTodoCommand(items: ReadonlyArray<TodoItem>, args: string): TodoCommandResult {
	const trimmed = args.trim();
	const copy = items.map((item) => ({ ...item }));

	if (trimmed === "") {
		return { items: copy, action: "list" };
	}
	if (trimmed === "clear") {
		return { items: [], action: "clear" };
	}

	const doneMatch = /^done\s+(\S+)$/.exec(trimmed);
	if (doneMatch) {
		const index = Number(doneMatch[1]);
		const item = Number.isInteger(index) ? copy[index - 1] : undefined;
		if (!item) {
			return { items: copy, action: "done", error: `No todo item ${doneMatch[1]}` };
		}
		item.done = true;
		return { items: copy, action: "done" };
	}

	copy.push({ text: trimmed, done: false });
	return { items: copy, action: "add" };
}
