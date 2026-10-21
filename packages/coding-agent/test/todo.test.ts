import { describe, expect, test } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	formatTodos,
	getTodosFromBranch,
	parseTodoCommand,
	TODO_ENTRY_TYPE,
} from "../src/core/todo.ts";

describe("parseTodoCommand", () => {
	test("parses list, add, done, remove and clear", () => {
		expect(parseTodoCommand("")).toEqual({ type: "list" });
		expect(parseTodoCommand("  write tests ")).toEqual({ type: "add", text: "write tests" });
		expect(parseTodoCommand("done 2")).toEqual({ type: "done", index: 1 });
		expect(parseTodoCommand("remove 1")).toEqual({ type: "remove", index: 0 });
		expect(parseTodoCommand("clear")).toEqual({ type: "clear" });
	});

	test("rejects done/remove without a valid number", () => {
		expect(parseTodoCommand("done").type).toBe("invalid");
		expect(parseTodoCommand("done abc").type).toBe("invalid");
		expect(parseTodoCommand("remove 0").type).toBe("invalid");
	});
});

describe("applyTodoCommand", () => {
	test("adds, completes and removes items without mutating the input", () => {
		const start = [{ text: "a", done: false }];
		const added = applyTodoCommand(start, { type: "add", text: "b" });
		expect(added.todos).toEqual([
			{ text: "a", done: false },
			{ text: "b", done: false },
		]);
		expect(start).toEqual([{ text: "a", done: false }]);

		const done = applyTodoCommand(added.todos, { type: "done", index: 0 });
		expect(done.todos[0].done).toBe(true);

		const removed = applyTodoCommand(done.todos, { type: "remove", index: 0 });
		expect(removed.todos).toEqual([{ text: "b", done: false }]);
	});

	test("reports an out-of-range index and leaves the list unchanged", () => {
		const result = applyTodoCommand([{ text: "a", done: false }], { type: "done", index: 4 });
		expect(result.changed).toBe(false);
		expect(result.error).toBe("No todo #5");
	});
});

describe("getTodosFromBranch", () => {
	test("returns the latest todo entry, or empty when none exists", () => {
		const entry = (id: string, data: unknown): SessionEntry =>
			({ type: "custom", id, parentId: null, timestamp: "", customType: TODO_ENTRY_TYPE, data }) as SessionEntry;
		expect(getTodosFromBranch([])).toEqual([]);
		const branch = [entry("1", [{ text: "old", done: false }]), entry("2", [{ text: "new", done: true }])];
		expect(getTodosFromBranch(branch)).toEqual([{ text: "new", done: true }]);
	});
});

describe("formatTodos", () => {
	test("numbers items and marks completed ones", () => {
		expect(
			formatTodos([
				{ text: "a", done: true },
				{ text: "b", done: false },
			]),
		).toBe("1. [x] a\n2. [ ] b");
	});
});
