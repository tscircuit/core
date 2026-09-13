import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouted vias inherit board tenting while manual overrides stay exposed", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      defaultViaTenting="bottom_tented"
      autorouter={{ local: true }}
    >
      <pcbnotetext
        text="Bottom tented board | Manual via exposed"
        pcbY={4.5}
        fontSize={0.6}
      />
      <testpoint name="A" footprintVariant="pad" pcbX={-4} layer="top" />
      <testpoint name="B" footprintVariant="pad" pcbX={4} layer="bottom" />
      <trace from="A.pin1" to="B.pin1" />
      <via name="Exposed" pcbY={-3} tented={false} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  const routedVias = vias.filter((via) => via.pcb_trace_id)
  expect(routedVias.length).toBeGreaterThan(0)
  expect(
    routedVias.every(
      (via) => via.tented_on_top === false && via.tented_on_bottom === true,
    ),
  ).toBe(true)
  expect(vias.find((via) => !via.pcb_trace_id)).toMatchObject({
    tented_on_top: false,
    tented_on_bottom: false,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    layer: "bottom",
  })
})
