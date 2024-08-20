import { soupToSvg } from "circuit-to-svg"
import { it, expect, type CustomMatcher, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"
import type { AnySoupElement } from "@tscircuit/soup"
import { Project } from "lib/Project"

expect.extend({
  async toMatchCircuitSnapshot(
    this: any,
    received: unknown,
  ): Promise<MatcherResult> {
    const testPath = import.meta.url.replace("file://", "")
    const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
    const snapshotName = `${path.basename(testPath || "")}.snap.svg`
    const filePath = path.join(snapshotDir, snapshotName)

    let soup: AnySoupElement[]
    if (received instanceof Project) {
      soup = received.getSoup()
    } else {
      soup = received as AnySoupElement[]
    }

    const svg = soupToSvg(soup)

    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true })
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, svg)
      return {
        message: () => `Snapshot created at ${filePath}`,
        pass: true,
      }
    }

    const existingSnapshot = fs.readFileSync(filePath, "utf-8")

    const result = await looksSame(
      Buffer.from(svg),
      Buffer.from(existingSnapshot),
      {
        strict: false,
        tolerance: 2,
      },
    )

    if (result.equal) {
      return {
        message: () => "Snapshot matches",
        pass: true,
      }
    }

    const diffPath = filePath.replace(".snap.svg", ".diff.png")
    await looksSame.createDiff({
      reference: Buffer.from(existingSnapshot),
      current: Buffer.from(svg),
      diff: diffPath,
      highlightColor: "#ff00ff",
    })

    return {
      message: () => `Snapshot does not match. Diff saved at ${diffPath}`,
      pass: false,
    }
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchCircuitSnapshot(): Promise<MatcherResult>
  }
}
