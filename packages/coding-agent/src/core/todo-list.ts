export interface TodoCommandResult {
	/** Items after applying the command. */
	items: string[];
	/** The item that was added, or undefined when the command only lists. */
	added: string | undefined;
}

/** Apply a "/todo [text]" command: non-empty text is appended, otherwise the items are left unchanged. */
export function applyTodoCommand(items: readonly string[], text: string): TodoCommandResult {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (!item) {
		return { items: [...items], added: undefined };
	}
	return { items: [...items, item], added: item };
}

/** Format todo items as a numbered list. */
export function formatTodoList(items: readonly string[]): string {
	return items.map((entry, index) => `${index + 1}. ${entry}`).join("\n");
}
