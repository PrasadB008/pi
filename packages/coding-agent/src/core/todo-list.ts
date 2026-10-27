/**
 * In-memory todo lists for the /todo slash command, kept per session id.
 * Items are not persisted: they live until the process exits.
 */
export class TodoStore {
	private readonly lists = new Map<string, string[]>();

	add(sessionId: string, text: string): string[] {
		const trimmed = text.trim();
		const items = this.list(sessionId);
		if (trimmed) {
			items.push(trimmed);
			this.lists.set(sessionId, items);
		}
		return [...items];
	}

	list(sessionId: string): string[] {
		return this.lists.get(sessionId) ?? [];
	}
}

export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) {
		return "No todo items. Add one with /todo <text>";
	}
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
