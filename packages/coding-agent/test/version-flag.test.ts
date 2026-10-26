import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ENV_AGENT_DIR, getPackageJsonPath, VERSION } from "../src/config.ts";

const cliPath = resolve(__dirname, "../src/cli.ts");
const packageJsonPath = resolve(__dirname, "../package.json");
// --import takes a module specifier, not a filesystem path.
const sourceResolverUrl = pathToFileURL(resolve(__dirname, "../src/experimental/source-resolver.ts")).href;
const tempDirs: string[] = [];

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

async function runCli(args: string[]): Promise<{ code: number | null; stdout: string }> {
	const tempRoot = realpathSync(mkdtempSync(join(tmpdir(), "pi-version-flag-")));
	tempDirs.push(tempRoot);
	const agentDir = join(tempRoot, "agent");
	const projectDir = join(tempRoot, "project");
	mkdirSync(agentDir, { recursive: true });
	mkdirSync(projectDir, { recursive: true });

	return new Promise((resolvePromise, reject) => {
		const child = spawn(process.execPath, ["--import", sourceResolverUrl, cliPath, ...args], {
			cwd: projectDir,
			env: { ...process.env, [ENV_AGENT_DIR]: agentDir, PI_OFFLINE: "1" },
			stdio: ["ignore", "pipe", "ignore"],
		});
		let stdout = "";
		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.on("error", reject);
		child.on("close", (code) => resolvePromise({ code, stdout }));
	});
}

describe("VERSION", () => {
	it("matches the version in package.json", () => {
		const pkgVersion = (JSON.parse(readFileSync(getPackageJsonPath(), "utf8")) as { version: string }).version;
		expect(VERSION).toBe(pkgVersion);
	});
});

describe("version flag", () => {
	const expectedVersion = (JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version: string }).version;

	it.each(["--version", "-v"])("%s prints the package version and exits 0", async (flag) => {
		const result = await runCli([flag]);
		expect(result.code).toBe(0);
		expect(result.stdout.trim()).toBe(expectedVersion);
	});
});
