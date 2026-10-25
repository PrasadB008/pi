import type { SessionStats } from "../../core/agent-session.ts";

export type StatsSummary = Pick<SessionStats, "totalMessages" | "userMessages" | "assistantMessages" | "toolCalls"> & {
	tokens: Pick<SessionStats["tokens"], "input" | "output" | "cacheRead" | "cacheWrite" | "total">;
};

export interface StatsLine {
	label: string;
	value: string;
}

/**
 * Build the label/value rows shown by the /stats command. Kept free of theme and
 * TUI dependencies so it can be unit tested.
 */
export function formatSessionStatsLines(stats: StatsSummary): StatsLine[] {
	const n = (value: number): string => value.toLocaleString("en-US");
	return [
		{
			label: "Messages",
			value: `${n(stats.totalMessages)} (${n(stats.userMessages)} user, ${n(stats.assistantMessages)} assistant)`,
		},
		{ label: "Tool calls", value: n(stats.toolCalls) },
		{
			label: "Tokens",
			value: `${n(stats.tokens.total)} (${n(stats.tokens.input)} input, ${n(stats.tokens.output)} output, ${n(stats.tokens.cacheRead)} cache read, ${n(stats.tokens.cacheWrite)} cache write)`,
		},
	];
}
