import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	emptyTodoState,
	formatTodoList,
	parseTodoCommand,
	reconstructTodoState,
	TODO_ENTRY_TYPE,
	type TodoState,
} from "../src/core/todos.ts";

function run(state: TodoState, text: string) {
	return applyTodoCommand(state, parseTodoCommand(text));
}

describe("parseTodoCommand", () => {
	it("lists on bare /todo", () => {
		expect(parseTodoCommand("/todo")).toEqual({ action: "list" });
	});

	it("parses add, done, rm and clear", () => {
		expect(parseTodoCommand("/todo add write tests")).toEqual({ action: "add", text: "write tests" });
		expect(parseTodoCommand("/todo done #2")).toEqual({ action: "toggle", id: 2 });
		expect(parseTodoCommand("/todo rm 3")).toEqual({ action: "remove", id: 3 });
		expect(parseTodoCommand("/todo clear")).toEqual({ action: "clear" });
	});

	it("reports usage errors", () => {
		expect(parseTodoCommand("/todo add").action).toBe("error");
		expect(parseTodoCommand("/todo done abc").action).toBe("error");
		expect(parseTodoCommand("/todo bogus").action).toBe("error");
	});
});

describe("applyTodoCommand", () => {
	it("supports add -> list -> done -> remove -> clear", () => {
		let state = emptyTodoState();

		let result = run(state, "/todo add first");
		expect(result.changed).toBe(true);
		state = result.state;
		state = run(state, "/todo add second").state;
		expect(state.todos.map((t) => t.id)).toEqual([1, 2]);

		result = run(state, "/todo");
		expect(result.changed).toBe(false);
		expect(result.message).toContain("[ ] #1 first");
		expect(result.message).toContain("[ ] #2 second");

		state = run(state, "/todo done 1").state;
		expect(formatTodoList(state)).toContain("[x] #1 first");
		expect(formatTodoList(state)).toContain("(1/2 done)");

		state = run(state, "/todo done 1").state;
		expect(state.todos[0]?.done).toBe(false);

		state = run(state, "/todo rm 1").state;
		expect(state.todos.map((t) => t.id)).toEqual([2]);

		// ids are not reused after removal
		state = run(state, "/todo add third").state;
		expect(state.todos.map((t) => t.id)).toEqual([2, 3]);

		state = run(state, "/todo clear").state;
		expect(state.todos).toEqual([]);
	});

	it("does not mutate the input state and reports missing ids", () => {
		const state = run(emptyTodoState(), "/todo add a").state;
		const result = run(state, "/todo rm 9");
		expect(result.changed).toBe(false);
		expect(result.message).toContain("not found");
		run(state, "/todo done 1");
		expect(state.todos[0]?.done).toBe(false);
	});
});

describe("reconstructTodoState", () => {
	it("uses the last todo entry and ignores other entries", () => {
		const first = run(emptyTodoState(), "/todo add a").state;
		const second = run(first, "/todo add b").state;
		const entries = [
			{ type: "custom", customType: TODO_ENTRY_TYPE, data: first },
			{ type: "custom", customType: "other", data: { todos: [], nextId: 99 } },
			{ type: "custom", customType: TODO_ENTRY_TYPE, data: second },
			{ type: "custom", customType: TODO_ENTRY_TYPE, data: "garbage" },
		] as unknown as SessionEntry[];
		expect(reconstructTodoState(entries)).toEqual(second);
		expect(reconstructTodoState([])).toEqual(emptyTodoState());
	});
});
