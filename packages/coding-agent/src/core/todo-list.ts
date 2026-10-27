/** In-memory todo list for the current interactive session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	add(text: string): number {
		this.items.push(text);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

/** Returns the todo text after "/todo", or undefined when the command has no text. */
export function parseTodoCommand(text: string): string | undefined {
	const arg = text.replace(/^\/todo\s*/, "").trim();
	return arg ? arg : undefined;
}

export function formatTodoList(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
