import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: terminal-undersized", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "terminal", name: "J_OUT", rotation: 270, undersized: true }],
    ["J_OUT"],
    { camPos: [-85, 65, 35] },
  )
})
