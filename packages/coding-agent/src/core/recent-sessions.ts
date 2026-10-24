import type { SessionInfo } from "./session-manager.ts";

export const DEFAULT_RECENT_SESSIONS_LIMIT = 10;

const MAX_TITLE_LENGTH = 60;

export interface RecentSessionLine {
	/** Session display name, or the first user message when unnamed. */
	title: string;
	/** Relative modification time, e.g. "5m ago". */
	age: string;
	messageCount: number;
	path: string;
}

export function formatRelativeAge(modified: Date, now: Date): string {
	const seconds = Math.max(0, Math.floor((now.getTime() - modified.getTime()) / 1000));
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return modified.toISOString().slice(0, 10);
}

/**
 * Pick the most recently modified sessions and describe each one on a line.
 * Does not mutate the input array.
 */
export function getRecentSessionLines(
	sessions: ReadonlyArray<SessionInfo>,
	now: Date,
	limit: number = DEFAULT_RECENT_SESSIONS_LIMIT,
): RecentSessionLine[] {
	return [...sessions]
		.sort((a, b) => b.modified.getTime() - a.modified.getTime())
		.slice(0, Math.max(0, limit))
		.map((session) => {
			const raw = (session.name?.trim() || session.firstMessage.trim() || "(empty session)").replace(/\s+/g, " ");
			const title = raw.length > MAX_TITLE_LENGTH ? `${raw.slice(0, MAX_TITLE_LENGTH - 3)}...` : raw;
			return {
				title,
				age: formatRelativeAge(session.modified, now),
				messageCount: session.messageCount,
				path: session.path,
			};
		});
}
