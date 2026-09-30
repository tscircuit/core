import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: usb-bottom-180", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "usb", name: "J_PWR", rotation: 180, layer: "bottom" }],
    [],
    {},
  )
})
