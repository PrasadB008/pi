/**
 * In-memory todo list behind the /todo slash command.
 * Items live only for the lifetime of the interactive process.
 */
export interface TodoCommandResult {
	/** Message to show the user. */
	message: string;
	/** Whether the message is a usage/empty-state warning rather than normal output. */
	isWarning: boolean;
}

/**
 * Apply a "/todo" or "/todo <text>" command to the list.
 * With text, appends it. Without text, lists the items.
 */
export function applyTodoCommand(items: string[], text: string): TodoCommandResult {
	const todo = text.replace(/^\/todo\s*/, "").trim();
	if (todo) {
		items.push(todo);
		return { message: `Todo added (${items.length}): ${todo}`, isWarning: false };
	}
	if (items.length === 0) {
		return { message: "No todos. Use /todo <text> to add one.", isWarning: true };
	}
	return { message: `Todos:\n${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}`, isWarning: false };
}
