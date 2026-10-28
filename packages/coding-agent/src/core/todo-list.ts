/**
 * In-memory todo list for the current interactive session.
 * Not persisted to the session file.
 */
export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Text of the `/todo` argument, or undefined when `/todo` is used alone. */
export function parseTodoArgument(text: string): string | undefined {
	const argument = text.replace(/^\/todo\s*/, "").trim();
	return argument ? argument : undefined;
}

export function formatTodoList(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
