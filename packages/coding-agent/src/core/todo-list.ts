/** In-memory todo list for the current session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	list(): ReadonlyArray<string> {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

/** Returns the text after "/todo", trimmed. Empty string means "list". */
export function parseTodoArgs(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}

export function formatTodoList(items: ReadonlyArray<string>): string {
	if (items.length === 0) {
		return "No todos. Add one with /todo <text>";
	}
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
