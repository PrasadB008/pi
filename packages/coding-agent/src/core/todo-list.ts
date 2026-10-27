export interface TodoCommandResult {
	items: string[];
	message: string;
}

/**
 * Apply a `/todo` command line to the current list.
 * `/todo <text>` appends an item; `/todo` alone lists the items.
 * Returns a new list and the message to show; the input list is not mutated.
 */
export function applyTodoCommand(items: readonly string[], text: string): TodoCommandResult {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		const next = [...items, item];
		return { items: next, message: `Todo added (${next.length}): ${item}` };
	}
	if (items.length === 0) {
		return { items: [...items], message: "No todo items. Add one with /todo <text>" };
	}
	return {
		items: [...items],
		message: ["Todo:", ...items.map((entry, index) => `${index + 1}. ${entry}`)].join("\n"),
	};
}
