import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { extractTodos } from "../src/core/todo-list.ts";

function toolResult(id: string, toolName: string, details: unknown): SessionEntry {
	return {
		type: "message",
		id,
		parentId: null,
		timestamp: new Date(0).toISOString(),
		message: {
			role: "toolResult",
			toolCallId: id,
			toolName,
			content: [{ type: "text", text: "ok" }],
			details,
			isError: false,
			timestamp: 0,
		},
	} as SessionEntry;
}

describe("extractTodos", () => {
	it("returns an empty list when there are no todo tool results", () => {
		expect(extractTodos([])).toEqual([]);
		expect(extractTodos([toolResult("a", "bash", { todos: [{ id: 1, text: "x", done: false }] })])).toEqual([]);
	});

	it("uses the latest todo tool result", () => {
		const entries = [
			toolResult("a", "todo", { todos: [{ id: 1, text: "first", done: false }] }),
			toolResult("b", "bash", {}),
			toolResult("c", "todo", {
				todos: [
					{ id: 1, text: "first", done: true },
					{ id: 2, text: "second", done: false },
				],
			}),
		];
		expect(extractTodos(entries)).toEqual([
			{ id: 1, text: "first", done: true },
			{ id: 2, text: "second", done: false },
		]);
	});

	it("drops malformed items and ignores results without a todos array", () => {
		const entries = [
			toolResult("a", "todo", { todos: [{ id: 1, text: "keep", done: false }, { id: "2" }, null] }),
			toolResult("b", "todo", undefined),
		];
		expect(extractTodos(entries)).toEqual([{ id: 1, text: "keep", done: false }]);
	});
});
