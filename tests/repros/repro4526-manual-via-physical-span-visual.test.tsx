import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ManualViaPhysicalSpanPcbPathBoard } from "tests/fixtures/manual-via-physical-span-board"

test("manual through-via spans on every PCB layer", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ManualViaPhysicalSpanPcbPathBoard />)
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-top.test.tsx"),
    { layer: "top" },
  )
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-inner1.test.tsx"),
    { layer: "inner1" },
  )
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-inner2.test.tsx"),
    { layer: "inner2" },
  )
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "-bottom.test.tsx"),
    { layer: "bottom" },
  )
})
