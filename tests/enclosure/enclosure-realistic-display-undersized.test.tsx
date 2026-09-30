import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: display-undersized", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "display", name: "SCREEN", undersized: true }],
    ["SCREEN"],
    { camPos: [45, 100, 45] },
  )
})
