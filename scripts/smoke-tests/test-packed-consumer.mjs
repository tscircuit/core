import { execFileSync } from "node:child_process"
import { mkdtempSync, copyFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url))
const scratch = mkdtempSync(join(tmpdir(), "core-packed-consumer-"))
// Do not copy the repository manifest/lockfile or install its dev dependencies.
// npm installs only the packed package and its declared dependencies/peers.
const env = { ...process.env }
delete env.NODE_PATH
delete env.NODE_OPTIONS

try {
  const suppliedTarball = process.argv[2]
  const tarball = suppliedTarball
    ? resolve(suppliedTarball)
    : join(
        scratch,
        JSON.parse(
          execFileSync(
            "npm",
            [
              "pack",
              "--json",
              "--ignore-scripts",
              "--pack-destination",
              scratch,
            ],
            { cwd: repositoryRoot, env, encoding: "utf8" },
          ),
        )[0].filename,
      )

  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  )
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--omit=dev",
      "--legacy-peer-deps=false",
      "--strict-peer-deps=false",
      tarball,
    ],
    { cwd: scratch, env, stdio: "inherit", timeout: 300_000 },
  )
  // The test file must live in the consumer too: ESM resolves imports relative
  // to the file, not cwd. Running a checkout script would defeat isolation.
  copyFileSync(
    new URL("./packed-consumer-fixture.mjs", import.meta.url),
    join(scratch, "smoke.mjs"),
  )
  execFileSync(process.execPath, [join(scratch, "smoke.mjs")], {
    cwd: scratch,
    env,
    stdio: "inherit",
    timeout: 60_000,
  })
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
