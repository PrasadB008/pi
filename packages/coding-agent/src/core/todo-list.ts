export interface TodoCommandResult {
	/** True when an item was added, false when the list was only displayed. */
	added: boolean;
	/** Text to show to the user. */
	message: string;
}

/**
 * Apply a "/todo" or "/todo <text>" command to an in-memory list.
 * With text, appends the item. Without text, formats the current items.
 */
export function applyTodoCommand(items: string[], text: string): TodoCommandResult {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		items.push(item);
		return { added: true, message: `Todo added (${items.length}): ${item}` };
	}
	if (items.length === 0) {
		return { added: false, message: "No todo items. Use /todo <text> to add one." };
	}
	const lines = items.map((entry, index) => `${index + 1}. ${entry}`);
	return { added: false, message: `Todo list:\n${lines.join("\n")}` };
}
