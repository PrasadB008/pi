import { describe, expect, it } from "vitest";
import { SessionManager } from "../src/core/session-manager.ts";
import {
	applyTodoAction,
	EMPTY_TODO_STATE,
	getTodoState,
	parseTodoCommand,
	TODOS_ENTRY_TYPE,
	type TodoState,
} from "../src/core/todos.ts";

function apply(state: TodoState, args: string): TodoState {
	const parsed = parseTodoCommand(args);
	if (parsed.type !== "action") throw new Error(`not an action: ${args}`);
	const result = applyTodoAction(state, parsed.action);
	if (!result.ok) throw new Error(result.error);
	return result.state;
}

describe("/todos", () => {
	it("parses subcommands", () => {
		expect(parseTodoCommand("")).toEqual({ type: "list" });
		expect(parseTodoCommand(" add write tests ")).toEqual({
			type: "action",
			action: { type: "add", text: "write tests" },
		});
		expect(parseTodoCommand("done #2")).toEqual({ type: "action", action: { type: "done", id: 2 } });
		expect(parseTodoCommand("done x").type).toBe("error");
		expect(parseTodoCommand("add").type).toBe("error");
		expect(parseTodoCommand("bogus").type).toBe("error");
	});

	it("adds, completes, removes and clears items without reusing ids", () => {
		let state = apply(EMPTY_TODO_STATE, "add one");
		state = apply(state, "add two");
		state = apply(state, "done 1");
		expect(state.items).toEqual([
			{ id: 1, text: "one", done: true },
			{ id: 2, text: "two", done: false },
		]);
		state = apply(state, "undo 1");
		expect(state.items[0].done).toBe(false);
		state = apply(state, "remove 1");
		state = apply(state, "add three");
		expect(state.items.map((item) => item.id)).toEqual([2, 3]);
		expect(apply(state, "clear").items).toEqual([]);
		expect(applyTodoAction(state, { type: "done", id: 99 }).ok).toBe(false);
	});

	it("restores the latest snapshot from the session branch", () => {
		const manager = SessionManager.inMemory();
		expect(getTodoState(manager.getBranch())).toEqual(EMPTY_TODO_STATE);
		const first = apply(EMPTY_TODO_STATE, "add one");
		manager.appendCustomEntry(TODOS_ENTRY_TYPE, first);
		manager.appendCustomEntry(TODOS_ENTRY_TYPE, apply(first, "add two"));
		expect(getTodoState(manager.getBranch()).items.map((item) => item.text)).toEqual(["one", "two"]);
	});
});
