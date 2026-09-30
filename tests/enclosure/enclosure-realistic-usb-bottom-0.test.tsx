import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: usb-bottom-0", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "usb", name: "J_PWR", rotation: 0, layer: "bottom" }],
    [],
    {},
  )
})
