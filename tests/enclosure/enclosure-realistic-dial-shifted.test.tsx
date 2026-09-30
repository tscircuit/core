import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: dial-shifted", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "dial", name: "RV_FINE", rotation: 180, offset: 6 }],
    ["RV_FINE"],
    { camPos: [-55, 55, -75] },
  )
})
