#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { $ } from "bun";
import pkg from "../package.json" with { type: "json" };

const { values: args } = parseArgs({
	args: process.args,
	options: {
		version: {
			type: "string",
			short: "v",
		},
	},
});

const newVersion = args.version.replace(/^v/, "");
console.log(newVersion);

pkg.version = newVersion;
await Bun.write("package.json", JSON.stringify(pkg, null, 2));
await $`git add package.json`;
await $`git commit -m 'version: ${newVersion}'`;
await $`git tag v${newVersion}`;
await $`git push`;
await $`git push --tags`;
