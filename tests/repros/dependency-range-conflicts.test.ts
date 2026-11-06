import { expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { findDependencyRangeConflicts } from "../../scripts/check-dependency-ranges"

test("flags nested runtime ranges that can displace Core's shared dependencies", async () => {
  const rootModules = await mkdtemp(join(tmpdir(), "core-dependency-ranges-"))
  const footprinter = "@tscircuit/footprinter"
  const exporter = join(rootModules, "converter", "node_modules", "exporter")

  try {
    await mkdir(join(rootModules, footprinter), { recursive: true })
    await Bun.write(
      join(rootModules, footprinter, "package.json"),
      JSON.stringify({ name: footprinter, version: "0.0.450" }),
    )
    await Bun.write(
      join(rootModules, "converter", "package.json"),
      JSON.stringify({
        name: "converter",
        version: "1.0.0",
        dependencies: { exporter: "1.0.0" },
        optionalDependencies: { [footprinter]: "^0.0.450" },
      }),
    )
    await mkdir(exporter, { recursive: true })
    await Bun.write(
      join(exporter, "package.json"),
      JSON.stringify({
        name: "exporter",
        version: "1.0.0",
        dependencies: { [footprinter]: "^0.0.431" },
      }),
    )

    const preferredRanges = { [footprinter]: "^0.0.450" }
    const conflicts = await findDependencyRangeConflicts(
      rootModules,
      preferredRanges,
    )
    expect([...conflicts.keys()]).toEqual([
      "exporter > @tscircuit/footprinter@^0.0.431",
    ])

    await Bun.write(
      join(exporter, "package.json"),
      JSON.stringify({
        name: "exporter",
        version: "1.0.0",
        peerDependencies: { [footprinter]: "*" },
        devDependencies: { [footprinter]: "^0.0.450" },
      }),
    )
    expect(
      (await findDependencyRangeConflicts(rootModules, preferredRanges)).size,
    ).toBe(0)
  } finally {
    await rm(rootModules, { recursive: true, force: true })
  }
})
