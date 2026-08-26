import { cp, mkdtemp, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const repositoryRoot = join(import.meta.dir, "..")
const nodeModulesDirectory = join(repositoryRoot, "node_modules")
const installedSolverDirectory = join(
  nodeModulesDirectory,
  "@tscircuit",
  "schematic-trace-solver",
)
const publishedSolverDirectory = join(
  nodeModulesDirectory,
  "@tscircuit",
  "schematic-trace-solver-published",
)
const buildDirectory = await mkdtemp(
  join(tmpdir(), "core-pinned-schematic-trace-solver-"),
)

try {
  await cp(installedSolverDirectory, buildDirectory, { recursive: true })
  await symlink(
    nodeModulesDirectory,
    join(buildDirectory, "node_modules"),
    "dir",
  )

  const buildProcess = Bun.spawn(
    [
      join(nodeModulesDirectory, ".bin", "tsup-node"),
      "lib/index.ts",
      "--format",
      "esm",
    ],
    {
      cwd: buildDirectory,
      stdout: "inherit",
      stderr: "inherit",
    },
  )
  const exitCode = await buildProcess.exited

  if (exitCode !== 0) {
    throw new Error(`Pinned schematic trace solver build exited ${exitCode}`)
  }

  await cp(
    join(buildDirectory, "dist"),
    join(installedSolverDirectory, "dist"),
    { recursive: true, force: true },
  )
  await cp(
    join(publishedSolverDirectory, "dist", "index.d.ts"),
    join(installedSolverDirectory, "dist", "index.d.ts"),
    { force: true },
  )
} finally {
  await rm(buildDirectory, { recursive: true, force: true })
}
