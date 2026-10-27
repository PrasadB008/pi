import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		const items: string[] = [];
		expect(applyTodoCommand(items, "/todo")).toEqual({ kind: "empty", text: "No todos. Add one with /todo <text>" });
		expect(items).toEqual([]);
	});

	it("adds items and lists them in order", () => {
		const items: string[] = [];
		expect(applyTodoCommand(items, "/todo write tests")).toEqual({
			kind: "added",
			text: "Todo added (1): write tests",
		});
		expect(applyTodoCommand(items, "/todo   open PR  ").text).toBe("Todo added (2): open PR");
		expect(items).toEqual(["write tests", "open PR"]);
		expect(applyTodoCommand(items, "/todo")).toEqual({ kind: "listed", text: "1. write tests\n2. open PR" });
		expect(items).toHaveLength(2);
	});
});
