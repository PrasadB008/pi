import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import {
	applyTodosCommand,
	emptyTodosState,
	formatTodos,
	getTodosState,
	parseTodosCommand,
	TODOS_ENTRY_TYPE,
} from "../src/core/todos.ts";

function customEntry(data: unknown): SessionEntry {
	return {
		type: "custom",
		customType: TODOS_ENTRY_TYPE,
		data,
		id: "x",
		parentId: null,
		timestamp: "2026-01-01T00:00:00.000Z",
	};
}

describe("/todos", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("parses subcommands", () => {
		expect(parseTodosCommand("")).toEqual({ action: "list" });
		expect(parseTodosCommand(" add  write   tests ")).toEqual({ action: "add", text: "write tests" });
		expect(parseTodosCommand("done #2")).toEqual({ action: "done", id: 2 });
		expect(parseTodosCommand("rm 3")).toEqual({ action: "remove", id: 3 });
		expect(parseTodosCommand("clear")).toEqual({ action: "clear" });
		expect(parseTodosCommand("add").action).toBe("invalid");
		expect(parseTodosCommand("done abc").action).toBe("invalid");
		expect(parseTodosCommand("bogus").action).toBe("invalid");
	});

	it("adds, completes, reopens and removes items without mutating the input", () => {
		const start = emptyTodosState();
		const added = applyTodosCommand(start, { action: "add", text: "first" });
		expect(start.items).toEqual([]);
		expect(added.state.items).toEqual([{ id: 1, text: "first", done: false }]);

		const done = applyTodosCommand(added.state, { action: "done", id: 1 });
		expect(done.changed).toBe(true);
		expect(done.state.items[0].done).toBe(true);
		expect(applyTodosCommand(done.state, { action: "done", id: 1 }).changed).toBe(false);

		const reopened = applyTodosCommand(done.state, { action: "undo", id: 1 });
		expect(reopened.state.items[0].done).toBe(false);

		const removed = applyTodosCommand(reopened.state, { action: "remove", id: 1 });
		expect(removed.state.items).toEqual([]);
		// Ids are not reused after removal.
		expect(applyTodosCommand(removed.state, { action: "add", text: "second" }).state.items[0].id).toBe(2);
	});

	it("reports unknown ids without changing state", () => {
		const result = applyTodosCommand(emptyTodosState(), { action: "done", id: 9 });
		expect(result.changed).toBe(false);
		expect(result.message).toBe("No todo #9");
	});

	it("reads the latest snapshot from a branch and ignores malformed data", () => {
		const older = { items: [{ id: 1, text: "a", done: false }], nextId: 2 };
		const newer = { items: [{ id: 1, text: "a", done: true }], nextId: 2 };
		expect(getTodosState([customEntry(older), customEntry(newer)])).toEqual(newer);
		expect(getTodosState([customEntry(older), customEntry({ bad: true })])).toEqual(older);
		expect(getTodosState([])).toEqual(emptyTodosState());
	});

	it("formats the list", () => {
		const text = formatTodos({
			items: [
				{ id: 1, text: "a", done: true },
				{ id: 2, text: "b", done: false },
			],
			nextId: 3,
		});
		expect(text).toBe("Todos (1/2 done)\n[x] #1 a\n[ ] #2 b");
	});
});
