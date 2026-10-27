export type TodoCommandResult =
	| { kind: "list"; items: readonly string[] }
	| { kind: "added"; items: readonly string[]; added: string };

/**
 * Handle the text of a `/todo` command against an in-memory list.
 * `/todo` alone lists items; `/todo <text>` returns a new list with `<text>` appended.
 * The input list is never mutated.
 */
export function runTodoCommand(text: string, items: readonly string[]): TodoCommandResult {
	const entry = text.replace(/^\/todo\s*/, "").trim();
	if (!entry) {
		return { kind: "list", items };
	}
	return { kind: "added", items: [...items, entry], added: entry };
}
