/** In-memory todo list for one interactive session. */
export class TodoList {
	private readonly items: string[] = [];

	/** Adds a trimmed item and returns its 1-based number, or undefined when the text is empty. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	get size(): number {
		return this.items.length;
	}

	/** Numbered lines, one per item. */
	format(): string[] {
		return this.items.map((item, index) => `${index + 1}. ${item}`);
	}
}

export type TodoCommandResult =
	| { kind: "added"; number: number; item: string }
	| { kind: "list"; lines: string[] }
	| { kind: "empty" };

/** Handles the text of a "/todo" or "/todo <text>" command against a list. */
export function runTodoCommand(list: TodoList, commandText: string): TodoCommandResult {
	const arg = commandText.replace(/^\/todo\s*/, "").trim();
	if (arg) {
		const number = list.add(arg);
		if (number !== undefined) return { kind: "added", number, item: arg };
	}
	if (list.size === 0) return { kind: "empty" };
	return { kind: "list", lines: list.format() };
}
