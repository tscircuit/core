import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sequential trace routing applies the board tenting default to generated vias", async () => {
  const { circuit } = getTestFixture({
    platform: { allowLegacyAutorouters: true },
  })
  circuit.add(
    <board
      width={12}
      height={12}
      defaultViaTenting="bottom_tented"
      autorouter={{ local: true, groupMode: "sequential-trace" }}
    >
      <testpoint name="A" footprintVariant="pad" pcbY={4} layer="top" />
      <testpoint name="B" footprintVariant="pad" pcbY={-4} layer="bottom" />
      <trace from="A.pin1" to="B.pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
  for (const via of vias) {
    expect([via.tented_on_top, via.tented_on_bottom]).toEqual([false, true])
  }
})
