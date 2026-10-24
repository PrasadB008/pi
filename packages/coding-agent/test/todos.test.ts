import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	emptyTodoState,
	formatTodoList,
	getTodoState,
	parseTodoCommand,
	TODOS_ENTRY_TYPE,
} from "../src/core/todos.ts";

describe("parseTodoCommand", () => {
	it("defaults to list", () => {
		expect(parseTodoCommand("")).toEqual({ action: "list" });
		expect(parseTodoCommand(" list ")).toEqual({ action: "list" });
	});

	it("parses add, done, remove and clear", () => {
		expect(parseTodoCommand("add write tests")).toEqual({ action: "add", text: "write tests" });
		expect(parseTodoCommand("done #2")).toEqual({ action: "toggle", id: 2 });
		expect(parseTodoCommand("remove 3")).toEqual({ action: "remove", id: 3 });
		expect(parseTodoCommand("clear")).toEqual({ action: "clear" });
	});

	it("reports invalid input", () => {
		expect(parseTodoCommand("add")).toHaveProperty("error");
		expect(parseTodoCommand("done x")).toHaveProperty("error");
		expect(parseTodoCommand("bogus")).toHaveProperty("error");
	});
});

describe("applyTodoCommand", () => {
	it("adds, toggles, removes and clears without mutating input", () => {
		const start = emptyTodoState();
		const added = applyTodoCommand(start, { action: "add", text: "a" });
		expect(start.todos).toHaveLength(0);
		expect(added.state.todos).toEqual([{ id: 1, text: "a", done: false }]);

		const done = applyTodoCommand(added.state, { action: "toggle", id: 1 });
		expect(done.state.todos[0]?.done).toBe(true);

		const removed = applyTodoCommand(done.state, { action: "remove", id: 1 });
		expect(removed.state.todos).toHaveLength(0);
		expect(removed.state.nextId).toBe(2);

		const cleared = applyTodoCommand(added.state, { action: "clear" });
		expect(cleared.state).toEqual(emptyTodoState());
	});

	it("errors on unknown ids", () => {
		expect(applyTodoCommand(emptyTodoState(), { action: "toggle", id: 9 }).error).toBe("Todo #9 not found");
		expect(applyTodoCommand(emptyTodoState(), { action: "remove", id: 9 }).changed).toBe(false);
	});
});

describe("getTodoState", () => {
	it("uses the latest snapshot on the branch", () => {
		const entry = (data: unknown): SessionEntry =>
			({ type: "custom", customType: TODOS_ENTRY_TYPE, data, id: "x", parentId: null, timestamp: "" }) as SessionEntry;
		const first = applyTodoCommand(emptyTodoState(), { action: "add", text: "a" }).state;
		const second = applyTodoCommand(first, { action: "add", text: "b" }).state;
		expect(getTodoState([entry(first), entry({ junk: true }), entry(second)])).toEqual(second);
		expect(getTodoState([])).toEqual(emptyTodoState());
	});
});

describe("formatTodoList", () => {
	it("renders items with completion counts", () => {
		const state = applyTodoCommand(
			applyTodoCommand(emptyTodoState(), { action: "add", text: "a" }).state,
			{ action: "toggle", id: 1 },
		).state;
		expect(formatTodoList(state)).toBe("Todos (1/1 completed)\n[x] #1 a");
		expect(formatTodoList(emptyTodoState())).toContain("No todos yet");
	});
});
