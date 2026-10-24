import { describe, expect, it } from "vitest";
import { APP_NAME, VERSION } from "../src/config.ts";
import { formatAboutText, HOMEPAGE_URL } from "../src/core/about.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("/about", () => {
	it("prints project name, version and homepage", () => {
		expect(formatAboutText()).toBe(`Name: ${APP_NAME}\nVersion: ${VERSION}\nHomepage: ${HOMEPAGE_URL}`);
	});

	it("uses the provided name and version", () => {
		const lines = formatAboutText("pi", "1.2.3").split("\n");
		expect(lines).toEqual(["Name: pi", "Version: 1.2.3", "Homepage: https://pi.dev"]);
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "about")).toBe(true);
	});
});
