import { Fragment } from "react"
import { expect, test } from "bun:test"
import { lvcModel, lvcPins } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI topology crosses a series resistor and AC capacitor to multiple receivers", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board
      width={45}
      height={20}
      routingDisabled
      fabricatorPreset="jlcpcb_standard"
    >
      {["TX", "RX", "RX2"].map((name, i) => (
        <Fragment key={name}>
          <chip
            name={name}
            footprint="sot23_5"
            pcbX={i * 12 - 12}
            pinLabels={lvcPins}
          />
          <ibismodel componentRef={`.${name}`} {...lvcModel} />
        </Fragment>
      ))}
      <resistor name="RS" resistance="33" footprint="0402" pcbX={-6} />
      <capacitor name="AC" capacitance="100nF" footprint="0402" pcbX={-3} />
      <trace from=".TX > .Y" to=".RS > .pin1" />
      <trace from=".RS > .pin2" to=".AC > .pin1" />
      <trace from=".AC > .pin2" to=".RX > .A" />
      <trace from=".RX > .A" to=".RX2 > .A" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal
          name="DATA"
          driver=".TX > .Y"
          receiver={[".RX > .A", { pin: ".RX2 > .A", model: "LVC1G04_IN_33" }]}
        />
      </signalintegrity>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()[0].receivers).toMatchObject([
    { kind: "single" },
    { kind: "single", ibis_model_name: "LVC1G04_IN_33" },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
