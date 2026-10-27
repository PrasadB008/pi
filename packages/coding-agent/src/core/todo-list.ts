/** In-memory todo list for one interactive session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	add(text: string): number {
		this.items.push(text);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Parses "/todo" or "/todo <text>" and returns the trimmed text (empty when listing). */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
