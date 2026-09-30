import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: display-clear", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "display", name: "SCREEN" }],
    [],
    { camPos: [45, 100, 45] },
  )
})
