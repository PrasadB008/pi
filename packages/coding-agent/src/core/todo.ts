export interface TodoCommandResult {
	items: string[];
	added: boolean;
	message: string;
}

/**
 * Apply a `/todo` command line to a todo list without mutating it.
 * `/todo` lists the items, `/todo <item>` appends one.
 */
export function applyTodoCommand(items: readonly string[], text: string): TodoCommandResult {
	const item = text.replace(/^\/todo\s*/, "").trim();
	const next = item ? [...items, item] : [...items];
	if (next.length === 0) {
		return { items: next, added: false, message: "No todos. Add one with /todo <item>" };
	}
	const header = item ? `Todo added (${next.length} total):` : "Todos:";
	const lines = next.map((todo, index) => `${index + 1}. ${todo}`);
	return { items: next, added: item.length > 0, message: [header, ...lines].join("\n") };
}
