import type { SessionEntry } from "./session-manager.ts";

/** Custom entry type used to persist the user's todo list in the session. */
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

/** Parse the text after `/todo`. Anything that is not a subcommand is added as a new item. */
export function parseTodoCommand(args: string): TodoCommand {
	const trimmed = args.trim();
	if (!trimmed) return { action: "list" };
	if (trimmed === "clear") return { action: "clear" };
	if (trimmed === "done") return { action: "invalid", message: "Usage: /todo done <id>" };
	const doneMatch = /^done\s+#?(\d+)$/.exec(trimmed);
	if (doneMatch) return { action: "toggle", id: Number(doneMatch[1]) };
	return { action: "add", text: trimmed };
}

function isTodoState(value: unknown): value is TodoState {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value as Partial<TodoState>;
	return typeof candidate.nextId === "number" && Array.isArray(candidate.todos);
}

/** Return the todo state recorded by the last todo entry on the given branch. */
export function reconstructTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	let state = emptyTodoState();
	for (const entry of branch) {
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		if (isTodoState(entry.data)) state = entry.data;
	}
	return state;
}

export interface TodoApplyResult {
	state: TodoState;
	changed: boolean;
	message: string;
}

/** Apply a mutating command to a state without modifying the input. */
export function applyTodoCommand(
	state: TodoState,
	command: Extract<TodoCommand, { action: "add" | "toggle" | "clear" }>,
): TodoApplyResult {
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
			const target = state.todos.find((todo) => todo.id === command.id);
			if (!target) return { state, changed: false, message: `Todo #${command.id} not found` };
			const todos = state.todos.map((todo) => (todo.id === command.id ? { ...todo, done: !todo.done } : todo));
			return {
				state: { todos, nextId: state.nextId },
				changed: true,
				message: `Todo #${target.id} ${target.done ? "reopened" : "completed"}`,
			};
		}
		case "clear":
			return {
				state: emptyTodoState(),
				changed: state.todos.length > 0,
				message: `Cleared ${state.todos.length} todo(s)`,
			};
	}
}

export function formatTodoList(state: TodoState): string {
	if (state.todos.length === 0) return "No todos. Add one with /todo <text>";
	const done = state.todos.filter((todo) => todo.done).length;
	const lines = state.todos.map((todo) => `[${todo.done ? "x" : " "}] #${todo.id} ${todo.text}`);
	return [`Todos (${done}/${state.todos.length} done)`, ...lines].join("\n");
}
