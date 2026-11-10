import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { busModel, busPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("differential model overrides emit independent p/n fields and survive cached imports", async () => {
  const { circuit: original } = getSiTestFixture()
  original.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      {["TX", "RX"].map((name) => (
        <group key={name}>
          <chip name={name} footprint="soic8" pinLabels={busPins} />
          <simulation.ibismodel componentRef={`.${name}`} {...busModel} />
        </group>
      ))}
      <trace from=".TX > .A" to=".RX > .A" />
      <trace from=".TX > .B" to=".RX > .B" />
      <simulation.pcbtransientchannelsimulation
        bitRate="250kbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="BUS"
          driverDisabled
          pattern="101"
          driverRef={{
            pin: { p: ".TX > .A", n: ".TX > .B" },
            model: { p: "a_b_p", n: "a_b_n" },
          }}
          receiverRef={{
            pin: { p: ".RX > .A", n: ".RX > .B" },
            model: { p: "a_b_p", n: "a_b_n" },
          }}
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await original.renderUntilSettled()
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      <subcircuit name="CACHE" circuitJson={original.getCircuitJson()} />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const rendered of [original, circuit]) {
    const signal = rendered.db.simulation_signal.list()[0]
    expect(signal.driver_disabled).toBe(true)
    expect(signal.pattern).toBe("101")
    expect(signal).not.toHaveProperty("seed")
    for (const endpoint of [signal.driver, ...signal.receivers]) {
      expect(endpoint).toMatchObject({
        p_ibis_model_name: "a_b_p",
        n_ibis_model_name: "a_b_n",
      })
      expect(endpoint).not.toHaveProperty("ibis_model_name")
    }
    expect(any_circuit_element.safeParse(signal).success).toBe(true)
  }
})
