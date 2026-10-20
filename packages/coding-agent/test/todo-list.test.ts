import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { formatTodoLines, getTodosFromBranch } from "../src/core/todo-list.ts";

function todoResult(todos: Array<{ id: number; text: string; done: boolean }>): SessionEntry {
	return {
		type: "message",
		id: "e",
		parentId: null,
		timestamp: new Date(0).toISOString(),
		message: {
			role: "toolResult",
			toolCallId: "c",
			toolName: "todo",
			content: [{ type: "text", text: "" }],
			details: { action: "add", todos, nextId: todos.length + 1 },
			isError: false,
			timestamp: 0,
		},
	} as SessionEntry;
}

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("uses the latest todo tool result on the branch", () => {
		const entries = [
			todoResult([{ id: 1, text: "a", done: false }]),
			todoResult([
				{ id: 1, text: "a", done: true },
				{ id: 2, text: "b", done: false },
			]),
		];
		expect(formatTodoLines(getTodosFromBranch(entries))).toEqual([
			"Todos (1/2 completed)",
			"[x] #1 a",
			"[ ] #2 b",
		]);
	});

	it("reports an empty list", () => {
		expect(formatTodoLines(getTodosFromBranch([]))).toEqual(["No todos on the current branch"]);
	});
});
