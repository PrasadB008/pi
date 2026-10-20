import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import {
	applyTodoCommand,
	emptyTodoState,
	formatTodoList,
	parseTodoCommand,
	reconstructTodoState,
	TODO_ENTRY_TYPE,
} from "../src/core/todo.ts";

function todoEntry(data: unknown): SessionEntry {
	return {
		type: "custom",
		customType: TODO_ENTRY_TYPE,
		data,
		id: "x",
		parentId: null,
		timestamp: new Date().toISOString(),
	};
}

describe("parseTodoCommand", () => {
	it("parses list, add, done and clear", () => {
		expect(parseTodoCommand("/todo")).toEqual({ action: "list" });
		expect(parseTodoCommand("/todo write tests")).toEqual({ action: "add", text: "write tests" });
		expect(parseTodoCommand("/todo done 3")).toEqual({ action: "toggle", id: 3 });
		expect(parseTodoCommand("/todo done #3")).toEqual({ action: "toggle", id: 3 });
		expect(parseTodoCommand("/todo clear")).toEqual({ action: "clear" });
	});

	it("rejects done without a numeric id", () => {
		expect(parseTodoCommand("/todo done").action).toBe("invalid");
		expect(parseTodoCommand("/todo done abc").action).toBe("invalid");
	});

	it("treats text starting with 'done' as an item", () => {
		expect(parseTodoCommand("/todo doneness check")).toEqual({ action: "add", text: "doneness check" });
	});
});

describe("applyTodoCommand", () => {
	it("adds, toggles and clears items", () => {
		let state = applyTodoCommand(emptyTodoState(), { action: "add", text: "a" }).state;
		state = applyTodoCommand(state, { action: "add", text: "b" }).state;
		expect(state.todos.map((t) => t.id)).toEqual([1, 2]);

		const toggled = applyTodoCommand(state, { action: "toggle", id: 2 });
		expect(toggled.changed).toBe(true);
		expect(toggled.state.todos[1].done).toBe(true);

		const missing = applyTodoCommand(state, { action: "toggle", id: 9 });
		expect(missing.changed).toBe(false);

		const cleared = applyTodoCommand(toggled.state, { action: "clear" });
		expect(cleared.state.todos).toEqual([]);
		expect(cleared.state.nextId).toBe(1);
	});
});

describe("reconstructTodoState", () => {
	it("uses the latest snapshot and ignores other entries", () => {
		const first = { todos: [{ id: 1, text: "a", done: false }], nextId: 2 };
		const second = { todos: [{ id: 1, text: "a", done: true }], nextId: 2 };
		const state = reconstructTodoState([todoEntry(first), todoEntry({ bad: true }), todoEntry(second)]);
		expect(state).toEqual(second);
		expect(reconstructTodoState([])).toEqual(emptyTodoState());
	});
});

describe("formatTodoList", () => {
	it("renders items with progress", () => {
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
