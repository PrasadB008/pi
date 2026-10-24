import { describe, expect, test } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoAction, formatTodos, getTodosFromBranch, parseTodoArgs, TODO_ENTRY_TYPE } from "../src/core/todo.ts";

function customEntry(id: string, customType: string, data: unknown): SessionEntry {
	return { type: "custom", id, parentId: null, timestamp: "2026-01-01T00:00:00.000Z", customType, data };
}

describe("parseTodoArgs", () => {
	test("empty and list show the list", () => {
		expect(parseTodoArgs("")).toEqual({ type: "list" });
		expect(parseTodoArgs("  list ")).toEqual({ type: "list" });
	});

	test("add keeps the full text", () => {
		expect(parseTodoArgs(" add write the tests ")).toEqual({ type: "add", text: "write the tests" });
		expect(parseTodoArgs("add").type).toBe("usage");
	});

	test("done, undo and rm convert 1-based numbers to indexes", () => {
		expect(parseTodoArgs("done 2")).toEqual({ type: "done", index: 1 });
		expect(parseTodoArgs("undo 1")).toEqual({ type: "undo", index: 0 });
		expect(parseTodoArgs("rm 3")).toEqual({ type: "remove", index: 2 });
		expect(parseTodoArgs("remove 3")).toEqual({ type: "remove", index: 2 });
	});

	test("rejects bad numbers and unknown subcommands", () => {
		expect(parseTodoArgs("done 0").type).toBe("usage");
		expect(parseTodoArgs("done x").type).toBe("usage");
		expect(parseTodoArgs("done").type).toBe("usage");
		expect(parseTodoArgs("frobnicate").type).toBe("usage");
	});
});

describe("applyTodoAction", () => {
	test("add, done, undo, remove and clear", () => {
		let result = applyTodoAction([], { type: "add", text: "a" });
		result = applyTodoAction(result.items, { type: "add", text: "b" });
		expect(result.items).toEqual([
			{ text: "a", done: false },
			{ text: "b", done: false },
		]);

		result = applyTodoAction(result.items, { type: "done", index: 0 });
		expect(result.items[0].done).toBe(true);
		result = applyTodoAction(result.items, { type: "undo", index: 0 });
		expect(result.items[0].done).toBe(false);

		result = applyTodoAction(result.items, { type: "remove", index: 0 });
		expect(result.items).toEqual([{ text: "b", done: false }]);

		result = applyTodoAction(result.items, { type: "clear" });
		expect(result.items).toEqual([]);
		expect(result.changed).toBe(true);
	});

	test("does not mutate the input and reports out-of-range items", () => {
		const input = [{ text: "a", done: false }];
		const result = applyTodoAction(input, { type: "done", index: 0 });
		expect(input[0].done).toBe(false);
		expect(result.items[0].done).toBe(true);

		const missing = applyTodoAction(input, { type: "done", index: 5 });
		expect(missing.error).toBe("No todo #6");
		expect(missing.changed).toBe(false);
	});

	test("listing and clearing an empty list do not change anything", () => {
		expect(applyTodoAction([], { type: "list" }).changed).toBe(false);
		expect(applyTodoAction([], { type: "clear" }).changed).toBe(false);
	});
});

describe("getTodosFromBranch", () => {
	test("uses the latest todo snapshot and ignores other entries", () => {
		const branch = [
			customEntry("1", TODO_ENTRY_TYPE, { items: [{ text: "old", done: false }] }),
			customEntry("2", "other", { items: [{ text: "nope", done: true }] }),
			customEntry("3", TODO_ENTRY_TYPE, {
				items: [{ text: "new", done: true }, { text: 5 }, { text: "also", done: false }],
			}),
		];
		expect(getTodosFromBranch(branch)).toEqual([
			{ text: "new", done: true },
			{ text: "also", done: false },
		]);
	});

	test("returns an empty list when no snapshot exists", () => {
		expect(getTodosFromBranch([])).toEqual([]);
	});
});

describe("formatTodos and registration", () => {
	test("formats numbered checkboxes", () => {
		expect(
			formatTodos([
				{ text: "a", done: true },
				{ text: "b", done: false },
			]),
		).toBe("1. [x] a\n2. [ ] b");
	});

	test("todo is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
