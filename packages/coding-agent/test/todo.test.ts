import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { applyTodoAction, getTodoItems, parseTodoArgs, TODO_ENTRY_TYPE } from "../src/core/todo.ts";

function todoEntry(data: unknown): SessionEntry {
	return {
		type: "custom",
		customType: TODO_ENTRY_TYPE,
		data,
		id: "a",
		parentId: null,
		timestamp: "2024-01-01T00:00:00.000Z",
	} as SessionEntry;
}

describe("parseTodoArgs", () => {
	it("parses list, add, done, rm and clear", () => {
		expect(parseTodoArgs("")).toEqual({ type: "list" });
		expect(parseTodoArgs(" write tests ")).toEqual({ type: "add", text: "write tests" });
		expect(parseTodoArgs("done 2")).toEqual({ type: "done", index: 1 });
		expect(parseTodoArgs("rm 1")).toEqual({ type: "remove", index: 0 });
		expect(parseTodoArgs("clear")).toEqual({ type: "clear" });
	});

	it("rejects missing or bad item numbers", () => {
		expect(parseTodoArgs("done").type).toBe("invalid");
		expect(parseTodoArgs("rm 0").type).toBe("invalid");
		expect(parseTodoArgs("done x").type).toBe("invalid");
	});

	it("treats text that merely starts with done as an item", () => {
		expect(parseTodoArgs("doneness check")).toEqual({ type: "add", text: "doneness check" });
	});
});

describe("applyTodoAction", () => {
	it("adds, completes and removes items", () => {
		let items = applyTodoAction([], { type: "add", text: "a" });
		items = applyTodoAction(items as never, { type: "add", text: "b" });
		items = applyTodoAction(items as never, { type: "done", index: 0 });
		expect(items).toEqual([
			{ text: "a", done: true },
			{ text: "b", done: false },
		]);
		expect(applyTodoAction(items as never, { type: "remove", index: 0 })).toEqual([{ text: "b", done: false }]);
	});

	it("returns an error for an out-of-range index", () => {
		expect(applyTodoAction([], { type: "done", index: 0 })).toBe("No todo item 1");
	});
});

describe("getTodoItems", () => {
	it("uses the latest todo snapshot and ignores malformed data", () => {
		const branch = [todoEntry([{ text: "old", done: false }]), todoEntry([{ text: "new", done: true }, 5])];
		expect(getTodoItems(branch)).toEqual([{ text: "new", done: true }]);
		expect(getTodoItems([])).toEqual([]);
	});
});
