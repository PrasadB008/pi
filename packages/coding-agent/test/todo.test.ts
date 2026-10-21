import { describe, expect, it } from "vitest";
import {
	applyTodoAction,
	formatTodoList,
	parseTodoCommand,
	readTodoItems,
	type TodoItem,
} from "../src/modes/interactive/todo.ts";

describe("parseTodoCommand", () => {
	it("parses each subcommand", () => {
		expect(parseTodoCommand("/todo")).toEqual({ type: "list" });
		expect(parseTodoCommand("/todo add write tests")).toEqual({ type: "add", text: "write tests" });
		expect(parseTodoCommand("/todo done 2")).toEqual({ type: "toggle", index: 1 });
		expect(parseTodoCommand("/todo rm 1")).toEqual({ type: "remove", index: 0 });
		expect(parseTodoCommand("/todo clear")).toEqual({ type: "clear" });
	});

	it("reports invalid input", () => {
		expect(parseTodoCommand("/todo add").type).toBe("error");
		expect(parseTodoCommand("/todo done x").type).toBe("error");
		expect(parseTodoCommand("/todo done 0").type).toBe("error");
		expect(parseTodoCommand("/todo bogus").type).toBe("error");
	});
});

describe("applyTodoAction", () => {
	const items: TodoItem[] = [
		{ text: "a", done: false },
		{ text: "b", done: false },
	];

	it("adds, toggles, removes and clears", () => {
		expect(applyTodoAction(items, { type: "add", text: "c" })).toEqual({
			items: [...items, { text: "c", done: false }],
		});
		expect(applyTodoAction(items, { type: "toggle", index: 1 })).toEqual({
			items: [items[0], { text: "b", done: true }],
		});
		expect(applyTodoAction(items, { type: "remove", index: 0 })).toEqual({ items: [items[1]] });
		expect(applyTodoAction(items, { type: "clear" })).toEqual({ items: [] });
	});

	it("rejects out-of-range indexes", () => {
		expect(applyTodoAction(items, { type: "toggle", index: 5 })).toEqual({ error: "No todo #6" });
		expect(applyTodoAction(items, { type: "remove", index: 2 })).toEqual({ error: "No todo #3" });
	});
});

describe("todo formatting and persistence", () => {
	it("formats the list", () => {
		expect(formatTodoList([])).toContain("No todos");
		expect(
			formatTodoList([
				{ text: "a", done: true },
				{ text: "b", done: false },
			]),
		).toBe("1. [x] a\n2. [ ] b");
	});

	it("ignores malformed persisted data", () => {
		expect(readTodoItems(undefined)).toEqual([]);
		expect(readTodoItems({ items: "nope" })).toEqual([]);
		expect(readTodoItems({ items: [{ text: "a", done: true }, { done: true }, null] })).toEqual([
			{ text: "a", done: true },
		]);
	});
});
