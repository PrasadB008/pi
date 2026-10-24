import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { readTodos, runTodoCommand, TODO_ENTRY_TYPE, TODO_USAGE } from "../src/core/todo.ts";

function todoEntry(id: string, items: unknown): SessionEntry {
	return {
		type: "custom",
		customType: TODO_ENTRY_TYPE,
		data: { items },
		id,
		parentId: null,
		timestamp: new Date().toISOString(),
	};
}

describe("/todo", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists an empty list without changing it", () => {
		const result = runTodoCommand([], "");
		expect(result.changed).toBe(false);
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds, completes, reopens and removes items", () => {
		let result = runTodoCommand([], "add write tests");
		expect(result.changed).toBe(true);
		expect(result.items).toEqual([{ text: "write tests", done: false }]);

		result = runTodoCommand(result.items, "add ship it");
		result = runTodoCommand(result.items, "done 1");
		expect(result.items.map((item) => item.done)).toEqual([true, false]);
		expect(runTodoCommand(result.items, "").message).toContain("1. [x] write tests");

		result = runTodoCommand(result.items, "undo 1");
		expect(result.items[0].done).toBe(false);

		result = runTodoCommand(result.items, "rm 1");
		expect(result.items).toEqual([{ text: "ship it", done: false }]);

		result = runTodoCommand(result.items, "clear");
		expect(result.items).toEqual([]);
		expect(result.changed).toBe(true);
	});

	it("does not mutate the input list", () => {
		const items = [{ text: "a", done: false }];
		runTodoCommand(items, "done 1");
		expect(items[0].done).toBe(false);
	});

	it("reports invalid input without changing the list", () => {
		const items = [{ text: "a", done: false }];
		for (const args of ["add", "done 2", "done x", "rm", "bogus"]) {
			const result = runTodoCommand(items, args);
			expect(result.isError).toBe(true);
			expect(result.changed).toBe(false);
			expect(result.items).toEqual(items);
		}
		expect(runTodoCommand(items, "bogus").message).toBe(TODO_USAGE);
	});

	it("reads the latest snapshot from session entries and ignores malformed items", () => {
		const entries = [
			todoEntry("1", [{ text: "old", done: false }]),
			todoEntry("2", [{ text: "new", done: true }, { text: 5 }, null]),
		];
		expect(readTodos(entries)).toEqual([{ text: "new", done: true }]);
		expect(readTodos([])).toEqual([]);
	});
});
