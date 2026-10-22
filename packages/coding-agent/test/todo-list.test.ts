import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { emptyTodoState, loadTodoState, runTodoCommand, TODO_ENTRY_TYPE } from "../src/modes/interactive/todo-list.ts";

function customEntry(data: unknown): SessionEntry {
	return {
		type: "custom",
		id: "e1",
		parentId: null,
		timestamp: new Date().toISOString(),
		customType: TODO_ENTRY_TYPE,
		data,
	};
}

describe("/todo command", () => {
	it("adds, completes, reopens and removes todos", () => {
		let state = emptyTodoState();
		state = runTodoCommand("add write tests", state).state;
		state = runTodoCommand("add ship it", state).state;
		expect(state.todos.map((todo) => todo.id)).toEqual([1, 2]);

		const done = runTodoCommand("done #1", state);
		expect(done.changed).toBe(true);
		expect(done.state.todos[0]?.done).toBe(true);
		expect(state.todos[0]?.done).toBe(false);

		const reopened = runTodoCommand("undo 1", done.state);
		expect(reopened.state.todos[0]?.done).toBe(false);

		const removed = runTodoCommand("remove 1", reopened.state);
		expect(removed.state.todos.map((todo) => todo.id)).toEqual([2]);
		expect(removed.state.nextId).toBe(3);
	});

	it("lists by default and reports errors without changing state", () => {
		const state = runTodoCommand("add one", emptyTodoState()).state;
		const listed = runTodoCommand("", state);
		expect(listed.changed).toBe(false);
		expect(listed.lines).toEqual(["Todos (0/1 done)", "[ ] #1 one"]);

		for (const args of ["add", "done", "done 9", "bogus"]) {
			const result = runTodoCommand(args, state);
			expect(result.error).toBe(true);
			expect(result.changed).toBe(false);
		}
	});

	it("clears the list", () => {
		const state = runTodoCommand("add one", emptyTodoState()).state;
		const cleared = runTodoCommand("clear", state);
		expect(cleared.changed).toBe(true);
		expect(cleared.state.todos).toEqual([]);
	});

	it("restores the latest snapshot from branch entries and ignores malformed data", () => {
		const first = runTodoCommand("add a", emptyTodoState()).state;
		const second = runTodoCommand("add b", first).state;
		const state = loadTodoState([customEntry(first), customEntry("garbage"), customEntry(second)]);
		expect(state.todos.map((todo) => todo.text)).toEqual(["a", "b"]);
		expect(loadTodoState([])).toEqual(emptyTodoState());
	});
});
