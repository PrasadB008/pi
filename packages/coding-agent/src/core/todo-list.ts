/**
 * In-memory todo list for the current interactive session, driven by the /todo command.
 */
export class TodoList {
	private items: string[] = [];

	add(text: string): number {
		this.items.push(text);
		return this.items.length;
	}

	getItems(): ReadonlyArray<string> {
		return this.items;
	}

	format(): string {
		if (this.items.length === 0) {
			return "No todo items. Add one with /todo <text>";
		}
		return ["Todo:", ...this.items.map((item, index) => `${index + 1}. ${item}`)].join("\n");
	}
}

/**
 * Handle the text of a /todo command. "/todo <text>" adds an item, "/todo" alone lists them.
 * Returns the message to show.
 */
export function runTodoCommand(list: TodoList, text: string): string {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (!item) {
		return list.format();
	}
	const count = list.add(item);
	return `Added todo #${count}: ${item}`;
}
