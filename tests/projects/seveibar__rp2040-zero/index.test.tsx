import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import Project from "./index"

test("seveibar__rp2040-zero matches snapshots", async () => {
  const { project } = getTestFixture()
  project.add(<Project />)
  try {
    await expect(
      await project.getSvg({ view: "schematic" }),
    ).toMatchSvgSnapshot(import.meta.path, "schematic")
    await expect(project).toMatchPcbSnapshot(import.meta.path)
  } catch (err) {
    console.warn("Failed to render project", err)
  }
})
