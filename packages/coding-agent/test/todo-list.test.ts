import { describe, expect, it } from "vitest";
import { runTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("runTodoCommand", () => {
	it("adds, lists, completes and clears items", () => {
		const items: TodoItem[] = [];

		expect(runTodoCommand(items, "")).toEqual({ kind: "list", items: [] });

		const first = runTodoCommand(items, "  write tests ");
		expect(first).toEqual({ kind: "added", index: 1, item: { text: "write tests", done: false } });
		runTodoCommand(items, "ship it");
		expect(items.map((item) => item.text)).toEqual(["write tests", "ship it"]);

		const done = runTodoCommand(items, "done 2");
		expect(done).toEqual({ kind: "done", item: { text: "ship it", done: true } });
		expect(items.map((item) => item.done)).toEqual([false, true]);

		expect(runTodoCommand(items, "clear")).toEqual({ kind: "cleared" });
		expect(items).toHaveLength(0);
	});

	it("reports errors for bad done arguments", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(runTodoCommand(items, "done")).toEqual({ kind: "error", message: "Usage: /todo done <n>" });
		expect(runTodoCommand(items, "done abc")).toEqual({ kind: "error", message: "Usage: /todo done <n>" });
		expect(runTodoCommand(items, "done 5")).toEqual({ kind: "error", message: "No todo item 5" });
		expect(items).toEqual([{ text: "a", done: false }]);
	});

	it("treats text that merely starts with done as a new item", () => {
		const items: TodoItem[] = [];
		expect(runTodoCommand(items, "doneness check").kind).toBe("added");
	});
});
