import { describe, expect, it } from "vitest";
import { formatSessionStatsLines, type StatsSummary } from "../src/modes/interactive/stats-format.ts";

function makeStats(overrides: Partial<StatsSummary> = {}): StatsSummary {
	return {
		totalMessages: 0,
		userMessages: 0,
		assistantMessages: 0,
		toolCalls: 0,
		tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		...overrides,
	};
}

describe("formatSessionStatsLines", () => {
	it("returns messages, tool calls and tokens rows in order", () => {
		const lines = formatSessionStatsLines(makeStats());
		expect(lines.map((line) => line.label)).toEqual(["Messages", "Tool calls", "Tokens"]);
	});

	it("formats zero values for an empty session", () => {
		const lines = formatSessionStatsLines(makeStats());
		expect(lines[0].value).toBe("0 (0 user, 0 assistant)");
		expect(lines[1].value).toBe("0");
		expect(lines[2].value).toBe("0 (0 input, 0 output, 0 cache read, 0 cache write)");
	});

	it("shows the message breakdown and tool call count", () => {
		const lines = formatSessionStatsLines(
			makeStats({ totalMessages: 12, userMessages: 5, assistantMessages: 7, toolCalls: 9 }),
		);
		expect(lines[0].value).toBe("12 (5 user, 7 assistant)");
		expect(lines[1].value).toBe("9");
	});

	it("groups thousands in token counts", () => {
		const lines = formatSessionStatsLines(
			makeStats({ tokens: { input: 1234567, output: 8900, cacheRead: 1000, cacheWrite: 42, total: 1244509 } }),
		);
		expect(lines[2].value).toBe("1,244,509 (1,234,567 input, 8,900 output, 1,000 cache read, 42 cache write)");
	});
});
