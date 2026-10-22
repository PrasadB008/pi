export interface TodoResult {
	kind: "added" | "list" | "empty";
	message: string;
}

/** In-memory todo list for one interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Handle the full "/todo" input: add the text if present, otherwise list items. */
	handle(text: string): TodoResult {
		const item = text.replace(/^\/todo\s*/, "").trim();
		if (item) {
			this.items.push(item);
			return { kind: "added", message: `Todo added (${this.items.length}): ${item}` };
		}
		if (this.items.length === 0) {
			return { kind: "empty", message: "No todo items. Use /todo <text> to add one." };
		}
		const lines = this.items.map((todo, index) => `${index + 1}. ${todo}`).join("\n");
		return { kind: "list", message: `Todo:\n${lines}` };
	}

	getItems(): readonly string[] {
		return this.items;
	}
}
