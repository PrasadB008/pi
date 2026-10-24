import { APP_NAME, VERSION } from "../config.ts";

export const HOMEPAGE_URL = "https://pi.dev";

export function formatAboutText(name: string = APP_NAME, version: string = VERSION): string {
	return [`Name: ${name}`, `Version: ${version}`, `Homepage: ${HOMEPAGE_URL}`].join("\n");
}
