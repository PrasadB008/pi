/** In-memory todo list for one session, driven by the `/todo` slash command. */
export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	list(): readonly string[] {
		return this.items;
	}
}

/**
 * Apply a `/todo` command line to a list and return the message to show.
 * `/todo <text>` adds an item; `/todo` alone lists the items.
 */
export function runTodoCommand(todos: TodoList, commandLine: string): string {
	const text = commandLine.replace(/^\/todo\s*/, "").trim();
	if (text) {
		todos.add(text);
		return `Todo added: ${text}`;
	}
	const items = todos.list();
	if (items.length === 0) {
		return "No todo items. Usage: /todo <text>";
	}
	return `Todo:\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}
