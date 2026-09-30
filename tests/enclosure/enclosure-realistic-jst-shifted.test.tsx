import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: jst-shifted", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "jst", name: "J_I2C", rotation: 90, widthOffset: 6 }],
    ["J_I2C"],
    { camPos: [85, 65, 35] },
  )
})
