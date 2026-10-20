import type { SessionEntry } from "./session-manager.ts";

/** customType of the session entries that store the /todo list. */
export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoState {
	todos: TodoItem[];
	nextId: number;
}

export type TodoCommand =
	| { action: "list" }
	| { action: "add"; text: string }
	| { action: "toggle"; id: number }
	| { action: "clear" }
	| { action: "invalid"; message: string };

export const TODO_USAGE = "Usage: /todo [<text> | done <id> | clear]";

export function emptyTodoState(): TodoState {
	return { todos: [], nextId: 1 };
}

/** Parse the full "/todo ..." input line. */
export function parseTodoCommand(text: string): TodoCommand {
	const args = text.replace(/^\/todo\s*/, "").trim();
	if (!args) return { action: "list" };
	if (args === "clear") return { action: "clear" };
	const doneMatch = /^done(?:\s+(.*))?$/.exec(args);
	if (doneMatch) {
		const idText = doneMatch[1]?.trim().replace(/^#/, "");
		if (!idText || !/^\d+$/.test(idText)) {
			return { action: "invalid", message: "Usage: /todo done <id>" };
		}
		return { action: "toggle", id: Number(idText) };
	}
	return { action: "add", text: args };
}

/** Rebuild the todo list from a session branch: the latest "todo" snapshot wins. */
export function reconstructTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	let state = emptyTodoState();
	for (const entry of branch) {
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		const data = entry.data as Partial<TodoState> | undefined;
		if (data && Array.isArray(data.todos) && typeof data.nextId === "number") {
			state = { todos: data.todos, nextId: data.nextId };
		}
	}
	return state;
}

export interface TodoResult {
	state: TodoState;
	/** True when the state changed and a new snapshot should be persisted. */
	changed: boolean;
	message: string;
}

/** Apply a non-list, non-invalid command to the state. */
export function applyTodoCommand(
	state: TodoState,
	command: Extract<TodoCommand, { action: "add" | "toggle" | "clear" }>,
): TodoResult {
	switch (command.action) {
		case "add": {
			const item: TodoItem = { id: state.nextId, text: command.text, done: false };
			return {
				state: { todos: [...state.todos, item], nextId: state.nextId + 1 },
				changed: true,
				message: `Added todo #${item.id}: ${item.text}`,
			};
		}
		case "toggle": {
			const target = state.todos.find((t) => t.id === command.id);
			if (!target) {
				return { state, changed: false, message: `Todo #${command.id} not found` };
			}
			const todos = state.todos.map((t) => (t.id === command.id ? { ...t, done: !t.done } : t));
			return {
				state: { todos, nextId: state.nextId },
				changed: true,
				message: `Todo #${target.id} ${target.done ? "reopened" : "completed"}`,
			};
		}
		case "clear": {
			if (state.todos.length === 0) {
				return { state, changed: false, message: "No todos to clear" };
			}
			return {
				state: emptyTodoState(),
				changed: true,
				message: `Cleared ${state.todos.length} todo(s)`,
			};
		}
	}
}

/** Plain-text rendering of the list. */
export function formatTodoList(state: TodoState): string {
	if (state.todos.length === 0) return "No todos. Add one with /todo <text>";
	const done = state.todos.filter((t) => t.done).length;
	const lines = state.todos.map((t) => `[${t.done ? "x" : " "}] #${t.id} ${t.text}`);
	return `Todos (${done}/${state.todos.length} done)\n${lines.join("\n")}`;
}
