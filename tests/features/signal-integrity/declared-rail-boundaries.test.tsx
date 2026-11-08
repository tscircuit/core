import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { Inverter } from "./fixtures/parts"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("explicit ground/power rails stop shunt traversal and keep signals separate", async () => {
  for (const ground of [true, false]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <DiagnosticBoard disconnected>
        <net name="CUSTOM_RAIL" isGroundNet={ground} isPowerNet={!ground} />
        <capacitor
          name="C1"
          capacitance="10pF"
          footprint="0603"
          connections={{ pin1: ".TX > .Y", pin2: "net.CUSTOM_RAIL" }}
        />
        <trace from=".RX > .A" to="net.CUSTOM_RAIL" />
        <signalintegrity bitRate="20Mbps" unrouted="ideal">
          <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
        </signalintegrity>
      </DiagnosticBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      'Receiver .RX > .A is not connected to the copper of signal "DATA".',
    )
  }
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board
      routingDisabled
      fabricatorPreset="jlcpcb_standard"
      width={40}
      height={24}
    >
      <net name="EARTH" isGroundNet />
      {[0, 1].map((i) => (
        <group key={i}>
          <Inverter name={`TX${i}`} pcbX={-12} pcbY={i * 8 - 4} />
          <Inverter name={`RX${i}`} pcbX={12} pcbY={i * 8 - 4} />
          <trace from={`.TX${i} > .Y`} to={`.RX${i} > .A`} />
          <capacitor
            name={`C${i}`}
            capacitance="10pF"
            footprint="0603"
            pcbY={i * 8 - 4}
            connections={{ pin1: `.TX${i} > .Y`, pin2: "net.EARTH" }}
          />
        </group>
      ))}
      <pcbnotetext
        text="D0/D1 stay separate across EARTH shunts"
        pcbY={9}
        fontSize={1}
      />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="D0" driver=".TX0 > .Y" receiver=".RX0 > .A" />
        <signal name="D1" driver=".TX1 > .Y" receiver=".RX1 > .A" />
      </signalintegrity>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()).toHaveLength(2)
  expect(
    circuit.db.source_component
      .list()
      .filter((c) => c.ftype === "simple_capacitor"),
  ).toHaveLength(2)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
