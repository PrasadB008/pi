import { describe, expect, it } from "vitest";
import { formatRelativeAge, getRecentSessionLines } from "../src/core/recent-sessions.ts";
import type { SessionInfo } from "../src/core/session-manager.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

const NOW = new Date("2025-06-15T12:00:00.000Z");

function makeSession(id: string, minutesAgo: number, overrides: Partial<SessionInfo> = {}): SessionInfo {
	const modified = new Date(NOW.getTime() - minutesAgo * 60_000);
	return {
		path: `/sessions/${id}.jsonl`,
		id,
		cwd: "/project",
		created: modified,
		modified,
		messageCount: 2,
		firstMessage: `first message of ${id}`,
		allMessagesText: "",
		...overrides,
	};
}

describe("/sessions command", () => {
	it("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "sessions")).toBe(true);
	});

	it("returns the most recently modified sessions first, limited to the requested count", () => {
		const sessions = [makeSession("old", 600), makeSession("newest", 1), makeSession("middle", 90)];

		const lines = getRecentSessionLines(sessions, NOW, 2);

		expect(lines.map((line) => line.path)).toEqual(["/sessions/newest.jsonl", "/sessions/middle.jsonl"]);
		expect(sessions.map((session) => session.id)).toEqual(["old", "newest", "middle"]);
	});

	it("uses the session name when set and falls back to the first message", () => {
		const lines = getRecentSessionLines(
			[makeSession("named", 1, { name: "  My refactor  " }), makeSession("unnamed", 2)],
			NOW,
		);

		expect(lines[0].title).toBe("My refactor");
		expect(lines[1].title).toBe("first message of unnamed");
	});

	it("collapses whitespace, truncates long titles, and labels empty sessions", () => {
		const lines = getRecentSessionLines(
			[
				makeSession("long", 1, { firstMessage: `line one\nline two ${"x".repeat(100)}` }),
				makeSession("empty", 2, { firstMessage: "   " }),
			],
			NOW,
		);

		expect(lines[0].title).toHaveLength(60);
		expect(lines[0].title.startsWith("line one line two ")).toBe(true);
		expect(lines[0].title.endsWith("...")).toBe(true);
		expect(lines[1].title).toBe("(empty session)");
	});

	it("returns an empty list for no sessions or a zero limit", () => {
		expect(getRecentSessionLines([], NOW)).toEqual([]);
		expect(getRecentSessionLines([makeSession("a", 1)], NOW, 0)).toEqual([]);
	});

	it("formats relative ages", () => {
		const ago = (ms: number) => new Date(NOW.getTime() - ms);
		expect(formatRelativeAge(ago(10_000), NOW)).toBe("just now");
		expect(formatRelativeAge(ago(5 * 60_000), NOW)).toBe("5m ago");
		expect(formatRelativeAge(ago(3 * 3_600_000), NOW)).toBe("3h ago");
		expect(formatRelativeAge(ago(2 * 86_400_000), NOW)).toBe("2d ago");
		expect(formatRelativeAge(new Date("2025-01-02T03:00:00.000Z"), NOW)).toBe("2025-01-02");
		expect(formatRelativeAge(new Date(NOW.getTime() + 60_000), NOW)).toBe("just now");
	});
});
