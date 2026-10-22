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

export interface TodoResult {
	/** New state to persist, or undefined if the command did not change anything. */
	state: TodoState | undefined;
	/** Lines to show to the user. */
	lines: string[];
	/** True if the arguments were invalid. */
	invalid?: boolean;
}

export function createEmptyTodoState(): TodoState {
	return { todos: [], nextId: 1 };
}

/** Apply the arguments of `/todo` to a state. Pure: does not mutate the input. */
export function applyTodoCommand(current: TodoState, args: string): TodoResult {
	const todos = current.todos.map((todo) => ({ ...todo }));

	if (args === "clear") {
		return { state: createEmptyTodoState(), lines: [`Cleared ${todos.length} todo(s)`] };
	}

	if (args === "done" || args.startsWith("done ")) {
		const id = Number(args.slice("done".length).trim().replace(/^#/, ""));
		const todo = Number.isInteger(id) ? todos.find((item) => item.id === id) : undefined;
		if (!todo) {
			return { state: undefined, lines: ["Usage: /todo done <id>"], invalid: true };
		}
		todo.done = !todo.done;
		return {
			state: { todos, nextId: current.nextId },
			lines: [`Todo #${todo.id} ${todo.done ? "completed" : "reopened"}`],
		};
	}

	if (args) {
		todos.push({ id: current.nextId, text: args, done: false });
		return {
			state: { todos, nextId: current.nextId + 1 },
			lines: [`Added todo #${current.nextId}: ${args}`],
		};
	}

	if (todos.length === 0) {
		return { state: undefined, lines: ["No todos. Usage: /todo <text> | /todo done <id> | /todo clear"] };
	}
	const doneCount = todos.filter((item) => item.done).length;
	return {
		state: undefined,
		lines: [
			`${doneCount}/${todos.length} completed`,
			...todos.map((item) => `[${item.done ? "x" : " "}] #${item.id} ${item.text}`),
		],
	};
}
