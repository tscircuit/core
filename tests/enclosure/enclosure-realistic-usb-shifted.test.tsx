import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: usb-shifted", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "usb", name: "J_PWR", widthOffset: 5 }],
    ["J_PWR"],
    {},
  )
})
