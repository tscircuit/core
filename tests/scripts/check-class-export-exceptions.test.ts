import { expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkClassExports } from "../../scripts/check-class-exports"

test("legacy exceptions allow only exact exports and fail when stale", () => {
  const root = mkdtempSync(join(tmpdir(), "class-export-exceptions-"))
  const exceptions = [
    {
      file: "lib/Existing.ts",
      exports: ["helper"],
      reason: "Existing shared helper",
    },
  ]
  try {
    mkdirSync(join(root, "lib"))
    const path = join(root, "lib/Existing.ts")
    writeFileSync(path, "export class Existing {}; export function helper() {}")
    expect(checkClassExports(root, exceptions)).toEqual([])
    writeFileSync(
      path,
      "export class Existing {}; export function helper() {}; export function newHelper() {}",
    )
    expect(checkClassExports(root, exceptions)[0]).toContain(
      "found Existing, helper, newHelper",
    )
    writeFileSync(path, "export class Existing {}; export function helper() {}")
    writeFileSync(
      join(root, "lib/Other.ts"),
      "export class Other {}; export function helper() {}",
    )
    expect(checkClassExports(root, exceptions)[0]).toContain("lib/Other.ts")
    rmSync(join(root, "lib/Other.ts"))
    writeFileSync(path, "export class Existing {}")
    expect(checkClassExports(root, exceptions)[0]).toContain(
      "lib/Existing.ts#helper: Stale",
    )
    rmSync(path)
    expect(checkClassExports(root, exceptions)[0]).toContain(
      "lib/Existing.ts#helper: Stale",
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
