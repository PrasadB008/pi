import { describe, expect, it } from "vitest";
import { type AssistantMessage, contentText, type ToolResultMessage } from "../src/index.ts";
import { countWords } from "../src/utils/text.ts";

const content: AssistantMessage["content"] = [
	{ type: "thinking", thinking: "reasoning" },
	{ type: "text", text: "first" },
	{ type: "toolCall", id: "1", name: "read", arguments: {} },
	{ type: "text", text: "second" },
];

describe("contentText", () => {
	it("extracts assistant text blocks", () => {
		expect(contentText(content)).toBe("first\nsecond");
	});

	it("supports custom separators", () => {
		expect(contentText(content, "")).toBe("firstsecond");
	});

	it("passes string content through", () => {
		expect(contentText("hello")).toBe("hello");
	});

	it("extracts text from tool-result content", () => {
		const toolResultContent: ToolResultMessage["content"] = [
			{ type: "text", text: "first" },
			{ type: "image", data: "...", mimeType: "image/png" },
			{ type: "text", text: "second" },
		];

		expect(contentText(toolResultContent, "")).toBe("firstsecond");
	});
});

describe("countWords", () => {
	it("counts words separated by single spaces", () => {
		expect(countWords("one two three")).toBe(3);
	});

	it("returns 0 for empty and whitespace-only text", () => {
		expect(countWords("")).toBe(0);
		expect(countWords(" \n\t ")).toBe(0);
	});

	it("ignores leading, trailing and repeated whitespace", () => {
		expect(countWords("  one \n\n two\tthree  ")).toBe(3);
	});

	it("counts a single word", () => {
		expect(countWords("hello")).toBe(1);
	});
});
