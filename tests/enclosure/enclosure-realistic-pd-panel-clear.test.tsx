import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: pd-panel-clear", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [
      { kind: "usb", name: "J_DATA", x: -12 },
      { kind: "usb", name: "J_PWR", x: 12 },
      { kind: "dial", name: "RV_COARSE", rotation: 180, x: -12 },
      { kind: "dial", name: "RV_FINE", rotation: 180, x: 12 },
      { kind: "terminal", name: "J_OUT", rotation: 90 },
      { kind: "jst", name: "J_I2C", rotation: 270 },
    ],
    [],
    {},
  )
})
