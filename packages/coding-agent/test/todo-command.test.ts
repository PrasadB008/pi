import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list when nothing was added", () => {
		expect(applyTodoCommand([], "/todo")).toEqual({ kind: "empty" });
	});

	it("adds trimmed text and then lists the items in order", () => {
		const todos: string[] = [];
		expect(applyTodoCommand(todos, "/todo   write tests  ")).toEqual({
			kind: "added",
			item: "write tests",
			count: 1,
		});
		expect(applyTodoCommand(todos, "/todo ship it")).toEqual({ kind: "added", item: "ship it", count: 2 });
		expect(applyTodoCommand(todos, "/todo")).toEqual({ kind: "list", items: ["write tests", "ship it"] });
	});
});
