import { rm, mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const pkg = process.argv[2];
if (!pkg) {
  console.error("Usage: bun run scripts/sync-project.ts <author/package>");
  process.exit(1);
}

const [author, packageName] = pkg.split("/");
if (!author || !packageName) {
  console.error("Package name must be in the format author/package");
  process.exit(1);
}

const projectDirName = `${author}__${packageName}`;
const targetDir = path.join("tests", "projects", projectDirName);

const res = await fetch(
  `https://api.tscircuit.com/package_releases/get_filesystem_map?package_name=${pkg}`,
);
if (!res.ok) {
  throw new Error(`Failed to fetch project: ${res.status} ${res.statusText}`);
}
const data = await res.json();
const files: Record<string, string> = data.filesystem_map;

await rm(targetDir, { recursive: true, force: true });

const skipFiles = new Set([
  "biome.json",
  "bun.lock",
  "bun.lockb",
  "package.json",
  "tsconfig.json",
  "tscircuit.config.json",
]);

for (const [filePath, content] of Object.entries(files)) {
  if (skipFiles.has(filePath)) continue;
  const fullPath = path.join(targetDir, filePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  const rewritten = content
    .replaceAll('"tscircuit"', '"lib"')
    .replaceAll("'tscircuit'", "'lib'");
  await writeFile(fullPath, rewritten);
}

const testContent = `import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import Project from "./index"

test("${projectDirName} matches snapshots", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Project />)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
`;

await writeFile(path.join(targetDir, "index.test.tsx"), testContent);

console.log(`Synced project to ${targetDir}`);
