import { expect } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { Inverter, Octal } from "./fixtures/parts"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI supports forward strobe references, per-signal units, masks and more than three signals", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board
      width={50}
      height={45}
      routingDisabled
      fabricatorPreset="jlcpcb_standard"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <Inverter name={`TX${i}`} pcbX={-15} pcbY={i * 5 - 17.5} />
          <trace from={`.TX${i} > .Y`} to={`.RX > .A${i + 1}`} />
        </group>
      ))}
      <Octal />
      <signalintegrity
        name="WRITE"
        bitRate="20Mbps"
        unrouted="ideal"
        corner="max"
        pdn="ideal"
      >
        <signal
          name="DQ0"
          driver={{ pin: ".TX0 > .Y", model: "LVC1G04_OUT_33" }}
          receiver=".RX > .A1"
          bitRate="10Mbps"
          pattern="0011010"
          seed={42}
          offset="2UI"
          probe="global"
          strobe="DQS"
          mask={{ vih: "2V", vil: "0.8V", setup: "75ps", hold: "100ps" }}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <signal
            key={i}
            name={`DQ${i + 1}`}
            driver={`.TX${i + 1} > .Y`}
            receiver={`.RX > .A${i + 2}`}
            pattern="prbs15"
          />
        ))}
        <signal
          name="DQS"
          driver=".TX7 > .Y"
          receiver=".RX > .A8"
          pattern="clock"
          offset="3ns"
        />
      </signalintegrity>
    </board>,
  )
  await circuit.renderUntilSettled()
  const signals = circuit.db.simulation_signal.list()
  expect(signals).toHaveLength(8)
  expect(signals[0]).toMatchObject({
    driver: { ibis_model_name: "LVC1G04_OUT_33" },
    bit_rate_bps: 10e6,
    offset_s: 2 / 10e6,
    probe: "global",
    strobe_simulation_signal_id: signals[7].simulation_signal_id,
    mask: { vih_v: 2, vil_v: 0.8, setup_s: 75e-12, hold_s: 100e-12 },
  })
  expect(signals[7].offset_s).toBeCloseTo(3e-9, 15)
  expect(circuit.db.simulation_signal_integrity.list()[0]).toMatchObject({
    corner: "max",
    pdn: "ideal",
  })
  expect(signals[0]).not.toHaveProperty("seed")
  expect(signals[7]).not.toHaveProperty("seed")
  expect(circuit.db.simulation_signal_integrity.list()[0]).not.toHaveProperty(
    "duration_s",
  )
  for (const signal of signals)
    expect(any_circuit_element.safeParse(signal).success).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
