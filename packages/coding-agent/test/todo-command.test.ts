import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, runTodoCommand } from "../src/core/todo-command.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists an empty list when called without text", () => {
		const result = runTodoCommand([], "");
		expect(result).toEqual({ kind: "list", items: [] });
		expect(formatTodoList(result.items)).toContain("No todo items");
	});

	it("adds trimmed text and keeps insertion order", () => {
		const first = runTodoCommand([], "  write tests ");
		expect(first).toEqual({ kind: "added", items: ["write tests"], added: "write tests" });

		const second = runTodoCommand(first.items, "ship it");
		expect(second.items).toEqual(["write tests", "ship it"]);

		const listed = runTodoCommand(second.items, "   ");
		expect(listed).toEqual({ kind: "list", items: ["write tests", "ship it"] });
		expect(formatTodoList(listed.items)).toBe("1. write tests\n2. ship it");
	});

	it("does not mutate the input list", () => {
		const items = ["a"];
		const result = runTodoCommand(items, "b");
		expect(items).toEqual(["a"]);
		expect(result.items).not.toBe(items);
	});
});
