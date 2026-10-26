export type TodoCommandResult =
	| { kind: "added"; index: number; item: string }
	| { kind: "list"; items: string[] };

/** In-memory todo list backing the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Handle the text of a "/todo" command: add the argument, or list when there is none. */
	handleCommand(text: string): TodoCommandResult {
		const item = text.replace(/^\/todo\s*/, "").trim();
		if (!item) {
			return { kind: "list", items: [...this.items] };
		}
		this.items.push(item);
		return { kind: "added", index: this.items.length, item };
	}
}
