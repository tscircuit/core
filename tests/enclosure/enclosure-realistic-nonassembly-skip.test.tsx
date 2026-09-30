import { test } from "bun:test"
import { verifyRealisticEnclosureDrc } from "tests/fixtures/verify-realistic-enclosure-drc"
test("standalone Circuit JSON DRC: nonassembly-skip", async () => {
  await verifyRealisticEnclosureDrc(
    import.meta.path,
    [{ kind: "usb", name: "J_PWR", undersized: true }],
    [],
    { inAssembly: false },
  )
})
