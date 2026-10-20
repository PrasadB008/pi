import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { formatTodoList, getTodosFromBranch } from "../src/core/todo-list.ts";

function toolResult(toolName: string, details: unknown): SessionEntry {
	return {
		type: "message",
		id: "e",
		parentId: null,
		timestamp: "2026-01-01T00:00:00.000Z",
		message: { role: "toolResult", toolCallId: "c", toolName, content: [], details, isError: false, timestamp: 0 },
	} as unknown as SessionEntry;
}

describe("todo list", () => {
	it("returns an empty list when the branch has no todo tool results", () => {
		expect(getTodosFromBranch([])).toEqual([]);
		expect(getTodosFromBranch([toolResult("read", { todos: [{ id: 1, text: "x", done: false }] })])).toEqual([]);
	});

	it("uses the latest todo tool result on the branch", () => {
		const branch = [
			toolResult("todo", { todos: [{ id: 1, text: "write code", done: false }], nextId: 2 }),
			toolResult("todo", {
				todos: [
					{ id: 1, text: "write code", done: true },
					{ id: 2, text: "add tests", done: false },
				],
				nextId: 3,
			}),
		];
		expect(getTodosFromBranch(branch)).toHaveLength(2);
	});

	it("formats items with done counts", () => {
		const output = formatTodoList([
			{ id: 1, text: "write code", done: true },
			{ id: 2, text: "add tests", done: false },
		]);
		expect(output).toBe("Todos (1/2 done)\n  [x] #1 write code\n  [ ] #2 add tests");
	});
});
