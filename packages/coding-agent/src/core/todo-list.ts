export type TodoCommandResult =
	| { kind: "added"; count: number; item: string }
	| { kind: "list"; items: string[] }
	| { kind: "empty" };

/** In-memory todo list backing the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Handle the text of a "/todo" or "/todo <text>" command. */
	handleCommand(text: string): TodoCommandResult {
		const item = text.replace(/^\/todo\s*/, "").trim();
		if (item) {
			this.items.push(item);
			return { kind: "added", count: this.items.length, item };
		}
		if (this.items.length === 0) {
			return { kind: "empty" };
		}
		return { kind: "list", items: [...this.items] };
	}
}

export function formatTodoItems(items: string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
