export interface TodoCommandResult {
	/** Text to show the user. */
	message: string;
}

/**
 * In-memory todo list for a session, driven by `/todo` command text.
 * `/todo <text>` adds an item; `/todo` alone lists the items.
 */
export class TodoList {
	private items: string[] = [];

	getItems(): readonly string[] {
		return this.items;
	}

	handleCommand(text: string): TodoCommandResult {
		const item = text.replace(/^\/todo\s*/, "").trim();
		if (item) {
			this.items.push(item);
			return { message: `Todo added (${this.items.length}): ${item}` };
		}
		if (this.items.length === 0) {
			return { message: "No todo items. Use /todo <text> to add one." };
		}
		return { message: ["Todo:", ...this.items.map((entry, index) => `${index + 1}. ${entry}`)].join("\n") };
	}
}
