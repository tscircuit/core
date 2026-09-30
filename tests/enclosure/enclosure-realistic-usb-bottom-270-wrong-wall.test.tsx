import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone JSON catches bottom 270 connector aimed at the wrong wall", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "usb", name: "J_PWR", layer: "bottom", rotation: 270, x: -29 }],
    ["J_PWR"],
    { camPos: [85, 65, 35] },
  )
})
