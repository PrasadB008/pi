export interface TodoCommandResult {
	kind: "added" | "listed" | "empty";
	/** Plain-text message to show. For "listed", the numbered items. */
	text: string;
}

/**
 * Apply a `/todo` command line to a todo list. `/todo <text>` appends <text>;
 * `/todo` alone lists the items. Mutates `items` only when adding.
 */
export function applyTodoCommand(items: string[], commandLine: string): TodoCommandResult {
	const item = commandLine.replace(/^\/todo\s*/, "").trim();
	if (item) {
		items.push(item);
		return { kind: "added", text: `Todo added (${items.length}): ${item}` };
	}
	if (items.length === 0) {
		return { kind: "empty", text: "No todos. Add one with /todo <text>" };
	}
	return { kind: "listed", text: items.map((todo, index) => `${index + 1}. ${todo}`).join("\n") };
}
