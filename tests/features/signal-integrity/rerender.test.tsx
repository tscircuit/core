import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { PcbChannel, PcbTransientChannelSimulation } from "lib/components"
import { busModel, busPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI updates and removes records without duplicating runs or mutating props", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      {["TX", "RX"].map((name) => (
        <group key={name}>
          <chip name={name} footprint="soic8" pinLabels={busPins} />
          <simulation.ibismodel componentRef={`.${name}`} {...busModel} />
        </group>
      ))}
      <trace from=".TX > .A" to=".RX > .A" />
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="DATA"
          driverRef=".TX > .A"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()
  const block = circuit.selectOne(
    "pcbtransientchannelsimulation",
  ) as PcbTransientChannelSimulation
  const signal = circuit.selectOne("pcbchannel") as PcbChannel
  const originalProps = structuredClone(signal._parsedProps)
  const originalId = signal.simulation_signal_id
  signal.setProps({
    ...signal.props,
    driverDisabled: true,
    pattern: "prbs31",
    offset: "1UI",
  })
  block.setProps({
    ...block.props,
    bitRate: "10Mbps",
    duration: "20UI",
  })
  await circuit.renderUntilSettled()
  expect(signal.simulation_signal_id).toBe(originalId)
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
  expect(circuit.db.simulation_signal.list()[0]).toMatchObject({
    driver_disabled: true,
    pattern: "prbs31",
    bit_rate_bps: 10e6,
    offset_s: 1 / 10e6,
  })
  expect(circuit.db.simulation_signal_integrity.list()[0]).toMatchObject({
    duration_s: 20 / 10e6,
  })
  expect(originalProps).toMatchObject({ pattern: "prbs7", offset: "0UI" })
  signal.setProps({ ...signal.props, driverDisabled: false, pattern: "1" })
  await circuit.renderUntilSettled()
  const record = circuit.db.simulation_signal.list()[0]
  expect(record.pattern).toBe("1")
  expect(record).not.toHaveProperty("driver_disabled")
  expect(record).not.toHaveProperty("seed")
  block.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
  expect(circuit.db.simulation_signal_integrity.list()).toHaveLength(0)
})
