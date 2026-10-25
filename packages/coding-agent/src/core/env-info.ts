export interface EnvInfo {
	nodeVersion: string;
	platform: string;
	piVersion: string;
}

/** Format environment info as plain text lines (one "Label: value" per line). */
export function formatEnvInfo(info: EnvInfo): string {
	return [`Node: ${info.nodeVersion}`, `Platform: ${info.platform}`, `Pi: ${info.piVersion}`].join("\n");
}
