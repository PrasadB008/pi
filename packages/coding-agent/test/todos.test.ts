import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	emptyTodoState,
	formatTodoList,
	parseTodoCommand,
	reconstructTodoState,
	TODO_ENTRY_TYPE,
} from "../src/core/todos.ts";

function todoEntry(data: unknown): SessionEntry {
	return {
		type: "custom",
		customType: TODO_ENTRY_TYPE,
		data,
		id: "id",
		parentId: null,
		timestamp: "2026-01-01T00:00:00.000Z",
	};
}

describe("parseTodoCommand", () => {
	it("lists with no arguments", () => {
		expect(parseTodoCommand("")).toEqual({ action: "list" });
		expect(parseTodoCommand("   ")).toEqual({ action: "list" });
	});

	it("parses subcommands", () => {
		expect(parseTodoCommand(" clear ")).toEqual({ action: "clear" });
		expect(parseTodoCommand("done 3")).toEqual({ action: "toggle", id: 3 });
		expect(parseTodoCommand("done #12")).toEqual({ action: "toggle", id: 12 });
	});

	it("rejects a bare done", () => {
		expect(parseTodoCommand("done")).toEqual({ action: "invalid", message: "Usage: /todo done <id>" });
	});

	it("treats other text as a new item", () => {
		expect(parseTodoCommand("write docs")).toEqual({ action: "add", text: "write docs" });
		expect(parseTodoCommand("done with the refactor")).toEqual({ action: "add", text: "done with the refactor" });
		expect(parseTodoCommand("clearing the cache")).toEqual({ action: "add", text: "clearing the cache" });
	});
});

describe("applyTodoCommand", () => {
	it("adds items with increasing ids without mutating the input", () => {
		const initial = emptyTodoState();
		const first = applyTodoCommand(initial, { action: "add", text: "a" });
		const second = applyTodoCommand(first.state, { action: "add", text: "b" });
		expect(initial.todos).toEqual([]);
		expect(second.state.todos.map((todo) => todo.id)).toEqual([1, 2]);
		expect(second.state.nextId).toBe(3);
	});

	it("toggles an item and reports unknown ids", () => {
		const { state } = applyTodoCommand(emptyTodoState(), { action: "add", text: "a" });
		const done = applyTodoCommand(state, { action: "toggle", id: 1 });
		expect(done.state.todos[0]?.done).toBe(true);
		expect(applyTodoCommand(done.state, { action: "toggle", id: 1 }).state.todos[0]?.done).toBe(false);
		const missing = applyTodoCommand(state, { action: "toggle", id: 9 });
		expect(missing.changed).toBe(false);
		expect(missing.state).toBe(state);
	});

	it("clear empties the list", () => {
		const { state } = applyTodoCommand(emptyTodoState(), { action: "add", text: "a" });
		expect(applyTodoCommand(state, { action: "clear" }).state.todos).toEqual([]);
		expect(applyTodoCommand(emptyTodoState(), { action: "clear" }).changed).toBe(false);
	});
});

describe("reconstructTodoState", () => {
	it("uses the last todo entry on the branch and ignores malformed data", () => {
		const first = applyTodoCommand(emptyTodoState(), { action: "add", text: "a" }).state;
		const second = applyTodoCommand(first, { action: "add", text: "b" }).state;
		expect(reconstructTodoState([todoEntry(first), todoEntry(second)])).toEqual(second);
		expect(reconstructTodoState([todoEntry(first), todoEntry("garbage")])).toEqual(first);
		expect(reconstructTodoState([])).toEqual(emptyTodoState());
	});
});

describe("formatTodoList", () => {
	it("shows a hint when empty and a checklist otherwise", () => {
		expect(formatTodoList(emptyTodoState())).toContain("/todo <text>");
		const added = applyTodoCommand(emptyTodoState(), { action: "add", text: "a" }).state;
		const toggled = applyTodoCommand(added, { action: "toggle", id: 1 }).state;
		expect(formatTodoList(toggled)).toBe("Todos (1/1 done)\n[x] #1 a");
	});
});
