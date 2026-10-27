/**
 * In-memory todo lists for the `/todo` slash command, one list per session id.
 * Lists live for the lifetime of the process and are not persisted.
 */
export class TodoStore {
	private lists = new Map<string, string[]>();

	add(sessionId: string, text: string): number {
		const items = this.lists.get(sessionId) ?? [];
		items.push(text);
		this.lists.set(sessionId, items);
		return items.length;
	}

	list(sessionId: string): readonly string[] {
		return this.lists.get(sessionId) ?? [];
	}
}

/** Format todo items as a numbered list, or a hint when there are none. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) return "No todos yet. Add one with /todo <text>";
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
