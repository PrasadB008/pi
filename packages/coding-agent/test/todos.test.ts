import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { applyTodoCommand, EMPTY_TODO_STATE, reconstructTodoState, TODOS_CUSTOM_ENTRY_TYPE } from "../src/core/todos.ts";

describe("/todos", () => {
	it("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("adds, completes, reopens, removes and clears items", () => {
		let result = applyTodoCommand(EMPTY_TODO_STATE, "add write tests");
		expect(result.ok).toBe(true);
		result = applyTodoCommand(result.state, "add ship it");
		expect(result.state.items.map((item) => item.id)).toEqual([1, 2]);

		result = applyTodoCommand(result.state, "done 1");
		expect(result.state.items[0].done).toBe(true);
		result = applyTodoCommand(result.state, "undo #1");
		expect(result.state.items[0].done).toBe(false);

		result = applyTodoCommand(result.state, "remove 1");
		expect(result.state.items).toEqual([{ id: 2, text: "ship it", done: false }]);
		// ids are not reused
		result = applyTodoCommand(result.state, "add another");
		expect(result.state.items[1].id).toBe(3);

		result = applyTodoCommand(result.state, "clear");
		expect(result.state.items).toEqual([]);
	});

	it("reports errors without changing state", () => {
		const state = applyTodoCommand(EMPTY_TODO_STATE, "add one").state;
		for (const args of ["add", "done", "done 9", "done abc", "bogus"]) {
			const result = applyTodoCommand(state, args);
			expect(result.ok).toBe(false);
			expect(result.state).toBe(state);
		}
	});

	it("lists without changing state", () => {
		const state = applyTodoCommand(EMPTY_TODO_STATE, "add one").state;
		const result = applyTodoCommand(state, "");
		expect(result.ok).toBe(true);
		expect(result.state).toBe(state);
		expect(result.message).toContain("#1 one");
	});

	it("reconstructs the latest snapshot from the session branch", () => {
		const session = SessionManager.inMemory();
		expect(reconstructTodoState(session.getBranch())).toEqual(EMPTY_TODO_STATE);

		const first = applyTodoCommand(EMPTY_TODO_STATE, "add one").state;
		session.appendCustomEntry(TODOS_CUSTOM_ENTRY_TYPE, first);
		const second = applyTodoCommand(first, "done 1").state;
		session.appendCustomEntry(TODOS_CUSTOM_ENTRY_TYPE, second);
		session.appendCustomEntry(TODOS_CUSTOM_ENTRY_TYPE, { bad: true });

		expect(reconstructTodoState(session.getBranch())).toEqual(second);
	});
});
