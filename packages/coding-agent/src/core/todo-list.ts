/** In-memory todo list for the current interactive session. Not persisted to the session file. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns its 1-based position, or undefined if the text is empty. */
	add(text: string): number | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

export interface TodoCommandResult {
	kind: "added" | "list" | "empty";
	message: string;
}

/** Run a `/todo` or `/todo <text>` input against the list and describe the outcome. */
export function runTodoCommand(todoList: TodoList, input: string): TodoCommandResult {
	const text = input.replace(/^\/todo\s*/, "").trim();
	if (text) {
		const position = todoList.add(text);
		return { kind: "added", message: `Todo ${position} added: ${text}` };
	}
	const items = todoList.list();
	if (items.length === 0) {
		return { kind: "empty", message: "No todos. Add one with /todo <text>" };
	}
	return { kind: "list", message: items.map((entry, index) => `${index + 1}. ${entry}`).join("\n") };
}
