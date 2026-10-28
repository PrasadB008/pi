/**
 * In-memory todo list behind the `/todo` slash command.
 * Items live only as long as the owning object; nothing is persisted.
 */
export class TodoList {
	private items: string[] = [];

	/** Add a trimmed item. Returns the new item count, or undefined if the text was empty. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/**
 * Run a `/todo` input line (`/todo` or `/todo <text>`) against a list.
 * Returns the message to show the user.
 */
export function runTodoCommand(todos: TodoList, input: string): string {
	const text = input.replace(/^\/todo\s*/, "");
	const count = todos.add(text);
	if (count !== undefined) {
		return `Todo added (${count}): ${text.trim()}`;
	}
	const items = todos.list();
	if (items.length === 0) {
		return "No todos. Use /todo <text> to add one.";
	}
	return `Todos:\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}
