import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	emptyTodoState,
	formatTodoList,
	getTodoState,
	isTodoUnsaved,
	parseTodoCommand,
	TODO_ENTRY_TYPE,
} from "../src/core/todos.ts";

function messageEntry(id: string, role: "user" | "assistant" | "toolResult"): SessionEntry {
	return {
		type: "message",
		id,
		parentId: null,
		timestamp: "2024-01-01T00:00:00.000Z",
		message: { role, content: [], timestamp: 0 },
	} as unknown as SessionEntry;
}

describe("isTodoUnsaved", () => {
	it("is true until the branch has a user or assistant message", () => {
		expect(isTodoUnsaved([])).toBe(true);
		expect(isTodoUnsaved([customEntry("a", emptyTodoState())])).toBe(true);
		expect(isTodoUnsaved([customEntry("a", emptyTodoState()), messageEntry("b", "toolResult")])).toBe(true);
		expect(isTodoUnsaved([customEntry("a", emptyTodoState()), messageEntry("b", "user")])).toBe(false);
		expect(isTodoUnsaved([messageEntry("b", "assistant")])).toBe(false);
	});
});

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

	it("does not treat list or clear followed by text as a command", () => {
		expect(parseTodoCommand("/todo clear the cache directory")).toEqual({
			action: "add",
			text: "clear the cache directory",
		});
		expect(parseTodoCommand("/todo list groceries")).toEqual({ action: "add", text: "list groceries" });
		expect(parseTodoCommand("/todo list")).toEqual({ action: "list" });
	});

	it("accepts only decimal ids", () => {
		for (const bad of ["0x2", "1e1", "0b11", "-1", "1.5", "0"]) {
			expect(parseTodoCommand(`/todo done ${bad}`).action).toBe("usage");
		}
		expect(parseTodoCommand("/todo done 12")).toEqual({ action: "done", id: 12 });
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
