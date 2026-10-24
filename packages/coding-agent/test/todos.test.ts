import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	emptyTodoState,
	formatTodoList,
	getTodoState,
	parseTodoCommand,
	TODO_ENTRY_TYPE,
} from "../src/core/todos.ts";

function customEntry(id: string, data: unknown, customType = TODO_ENTRY_TYPE): SessionEntry {
	return { type: "custom", customType, data, id, parentId: null, timestamp: "2024-01-01T00:00:00.000Z" };
}

describe("parseTodoCommand", () => {
	it("parses list, add, id commands and bare-text shorthand", () => {
		expect(parseTodoCommand("/todo")).toEqual({ action: "list" });
		expect(parseTodoCommand("/todo add write tests")).toEqual({ action: "add", text: "write tests" });
		expect(parseTodoCommand("/todo write tests")).toEqual({ action: "add", text: "write tests" });
		expect(parseTodoCommand("/todo done #2")).toEqual({ action: "done", id: 2 });
		expect(parseTodoCommand("/todo remove 3")).toEqual({ action: "remove", id: 3 });
		expect(parseTodoCommand("/todo clear")).toEqual({ action: "clear" });
	});

	it("reports usage for missing arguments", () => {
		expect(parseTodoCommand("/todo add").action).toBe("usage");
		expect(parseTodoCommand("/todo done abc").action).toBe("usage");
	});
});

describe("applyTodoCommand", () => {
	it("adds, completes, reopens, removes and clears without mutating input", () => {
		const start = emptyTodoState();
		const added = applyTodoCommand(start, { action: "add", text: "a" });
		expect(start.todos).toHaveLength(0);
		expect(added.state).toEqual({ todos: [{ id: 1, text: "a", done: false }], nextId: 2 });

		const done = applyTodoCommand(added.state, { action: "done", id: 1 });
		expect(done.state.todos[0].done).toBe(true);
		expect(applyTodoCommand(done.state, { action: "done", id: 1 }).changed).toBe(false);

		const reopened = applyTodoCommand(done.state, { action: "undo", id: 1 });
		expect(reopened.state.todos[0].done).toBe(false);

		const removed = applyTodoCommand(reopened.state, { action: "remove", id: 1 });
		expect(removed.state).toEqual({ todos: [], nextId: 2 });
		expect(applyTodoCommand(removed.state, { action: "remove", id: 1 }).message).toBe("No todo #1");

		const second = applyTodoCommand(removed.state, { action: "add", text: "b" });
		expect(second.state.todos[0].id).toBe(2);
		expect(applyTodoCommand(second.state, { action: "clear" }).state.todos).toEqual([]);
	});
});

describe("getTodoState", () => {
	it("uses the latest todo entry on the branch and ignores other custom entries", () => {
		const first = { todos: [{ id: 1, text: "a", done: false }], nextId: 2 };
		const second = { todos: [{ id: 1, text: "a", done: true }], nextId: 2 };
		const branch = [customEntry("1", first), customEntry("2", second), customEntry("3", { x: 1 }, "other")];
		expect(getTodoState(branch)).toEqual(second);
		expect(getTodoState([customEntry("1", "garbage")])).toEqual(emptyTodoState());
	});
});

describe("formatTodoList", () => {
	it("formats progress and items", () => {
		expect(formatTodoList(emptyTodoState())).toContain("No todos");
		const text = formatTodoList({
			todos: [
				{ id: 1, text: "a", done: true },
				{ id: 2, text: "b", done: false },
			],
			nextId: 3,
		});
		expect(text).toBe("Todos (1/2 done)\n[x] #1 a\n[ ] #2 b");
	});
});
