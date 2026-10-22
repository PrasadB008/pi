import { describe, expect, it } from "vitest";
import { applyTodoCommand, createEmptyTodoState, type TodoState } from "../src/core/todo.ts";

function apply(state: TodoState, args: string): TodoState {
	return applyTodoCommand(state, args).state ?? state;
}

describe("applyTodoCommand", () => {
	it("lists an empty state without changing it", () => {
		const result = applyTodoCommand(createEmptyTodoState(), "");
		expect(result.state).toBeUndefined();
		expect(result.lines[0]).toContain("No todos");
	});

	it("adds, lists, completes, reopens and clears items", () => {
		let state = createEmptyTodoState();
		state = apply(state, "write tests");
		state = apply(state, "ship it");
		expect(state.todos).toEqual([
			{ id: 1, text: "write tests", done: false },
			{ id: 2, text: "ship it", done: false },
		]);
		expect(state.nextId).toBe(3);

		state = apply(state, "done 1");
		expect(state.todos[0]?.done).toBe(true);
		expect(applyTodoCommand(state, "").lines).toEqual(["1/2 completed", "[x] #1 write tests", "[ ] #2 ship it"]);

		const reopened = applyTodoCommand(state, "done #1");
		expect(reopened.lines).toEqual(["Todo #1 reopened"]);
		expect(reopened.state?.todos[0]?.done).toBe(false);

		const cleared = applyTodoCommand(state, "clear");
		expect(cleared.state).toEqual(createEmptyTodoState());
		expect(cleared.lines).toEqual(["Cleared 2 todo(s)"]);
	});

	it("does not mutate the input state", () => {
		const state: TodoState = { todos: [{ id: 1, text: "a", done: false }], nextId: 2 };
		applyTodoCommand(state, "done 1");
		applyTodoCommand(state, "b");
		expect(state).toEqual({ todos: [{ id: 1, text: "a", done: false }], nextId: 2 });
	});

	it("rejects done with a missing or unknown id", () => {
		const state: TodoState = { todos: [{ id: 1, text: "a", done: false }], nextId: 2 };
		for (const args of ["done", "done x", "done 9"]) {
			const result = applyTodoCommand(state, args);
			expect(result.invalid).toBe(true);
			expect(result.state).toBeUndefined();
		}
	});
});
