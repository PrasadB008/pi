import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { getTodosFromBranch } from "../src/core/todo-list.ts";

function toolResult(toolName: string, details: unknown): SessionEntry {
	return {
		type: "message",
		id: "id",
		parentId: null,
		timestamp: new Date().toISOString(),
		message: { role: "toolResult", toolCallId: "c", toolName, content: [], details, isError: false, timestamp: 0 },
	} as SessionEntry;
}

describe("getTodosFromBranch", () => {
	it("returns an empty list when there are no todo results", () => {
		expect(getTodosFromBranch([toolResult("bash", { todos: [{ id: 1, text: "x", done: false }] })])).toEqual([]);
	});

	it("returns the todos from the last todo tool result", () => {
		const first = [{ id: 1, text: "a", done: false }];
		const second = [
			{ id: 1, text: "a", done: true },
			{ id: 2, text: "b", done: false },
		];
		const entries = [toolResult("todo", { todos: first }), toolResult("todo", { todos: second })];
		expect(getTodosFromBranch(entries)).toEqual(second);
	});

	it("ignores todo results without a todos array", () => {
		const todos = [{ id: 1, text: "a", done: false }];
		const entries = [toolResult("todo", { todos }), toolResult("todo", undefined), toolResult("todo", { todos: 3 })];
		expect(getTodosFromBranch(entries)).toEqual(todos);
	});
});

describe("/todo registration", () => {
	it("is a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
