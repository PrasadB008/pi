export interface TodoCommandResult {
	items: string[];
	message: string;
}

/**
 * Apply a `/todo` command line to the current list.
 * `/todo <text>` appends `<text>`; `/todo` alone lists the items.
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
	const lines = items.map((entry, index) => `${index + 1}. ${entry}`);
	return { items: [...items], message: `Todo items:\n${lines.join("\n")}` };
}
