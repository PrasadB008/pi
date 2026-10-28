/**
 * In-memory todo list backing the /todo slash command.
 * Items live only for the lifetime of the interactive process; they are not written to the session file.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when the text is empty. */
	add(text: string): string | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return trimmed;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Extract the argument of "/todo [text]". */
export function parseTodoArgument(command: string): string {
	return command.replace(/^\/todo\s*/, "").trim();
}

/** Format items as a numbered list, one per line. */
export function formatTodoList(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
