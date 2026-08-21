import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rp2040PinLabels = { pin20: ["XIN"] } as const

test.failing("RP2040 crystal traces honor their zero-via limit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8.2mm" height="17mm">
      <chip
        name="U1"
        pinLabels={rp2040PinLabels}
        footprint="qfn56_thermalpad3.1mmx3.1mm_p0.4001mm_w7.8999mm_h7.9001mm_pw0.2mm_pl0.85mm"
        pcbX={0}
        pcbY={0}
      />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="12pF"
        pinVariant="four_pin"
        footprint="crystal"
        maxTraceLength="20mm"
        pcbX={0}
        pcbY={-6.2}
      />
      <capacitor
        name="C_XIN"
        capacitance="18pF"
        footprint="0402"
        pcbX={0}
        pcbY={6}
      />

      <trace name="XIN" from=".Y1 > .pin1" to=".U1 > .XIN" />
      <trace name="CXIN" from=".C_XIN > .pin1" to=".Y1 > .pin1" />

      <pcbnotetext
        text="RP2040 CRYSTAL SIGNALS: MAX VIA COUNT 0"
        pcbY={-8}
        fontSize={0.4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })

  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("vias")),
  ).toHaveLength(0)
})
