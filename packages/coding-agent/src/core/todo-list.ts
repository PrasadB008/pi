/**
 * In-memory todo list behind the /todo slash command.
 * Items live for the lifetime of the interactive process and are not persisted.
 */

export type TodoCommand = { type: "add"; text: string } | { type: "list" };

/** Parse the full input line of a /todo command ("/todo" or "/todo <text>"). */
export function parseTodoCommand(text: string): TodoCommand {
	const argument = text.replace(/^\/todo\s*/, "").trim();
	return argument ? { type: "add", text: argument } : { type: "list" };
}

export class TodoList {
	private readonly items: string[] = [];

	add(text: string): number {
		this.items.push(text);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Plain-text rendering of the list, one numbered item per line. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) {
		return "No todos yet. Add one with /todo <text>";
	}
	return ["Todos", ...items.map((item, index) => `${index + 1}. ${item}`)].join("\n");
}
