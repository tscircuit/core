import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["BAT_POS"],
  pin2: ["BAT_NEG"],
} as const

const pinAttributes = {
  pin1: { mustBeConnected: true },
  BAT_POS: { mustBeConnected: true },
  pin2: { mustBeConnected: true },
  BAT_NEG: { mustBeConnected: true },
} as any

function BatteryClipUsingViaConnectsTo(props: ChipProps<typeof pinLabels>) {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-8.5mm"
            pcbY="0mm"
            width="5mm"
            height="3.5mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="8.5mm"
            pcbY="0mm"
            width="5mm"
            height="5.5mm"
            shape="rect"
          />
          <via
            pcbX="-8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            fromLayer="top"
            toLayer="bottom"
            connectsTo="pin1"
          />
          <via
            pcbX="8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            fromLayer="top"
            toLayer="bottom"
            connectsTo="pin2"
          />
        </footprint>
      }
      {...props}
    />
  )
}

function BatteryClipUsingPlatedHolePortHints(
  props: ChipProps<typeof pinLabels>,
) {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-8.5mm"
            pcbY="0mm"
            width="5mm"
            height="3.5mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="8.5mm"
            pcbY="0mm"
            width="5mm"
            height="5.5mm"
            shape="rect"
          />
          <platedhole
            portHints={["pin1"]}
            pcbX="-8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            shape="circle"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const summarizeDirectPorts = (component: any) =>
  component.children
    .filter((child: any) => child.componentName === "Port")
    .map((port: any) => ({
      name: port.props.name,
      aliases: port.getNameAndAliases(),
      source_port_id: port.source_port_id,
      pcb_port_id: port.pcb_port_id,
      matched: port.matchedComponents.map((c: any) => c.getString()),
    }))

test("repro108: footprint composite pin mapping", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="130mm" height="40mm" layers={2}>
      <BatteryClipUsingViaConnectsTo name="J_VIA" pcbX={-35} pcbY={0} />
      <BatteryClipUsingPlatedHolePortHints name="J_PH" pcbX={35} pcbY={0} />

      <resistor
        name="R_VIA_POS"
        resistance="10k"
        footprint="0603"
        pcbX={-10}
        pcbY={-7}
        pcbRotation={90}
      />
      <resistor
        name="R_VIA_NEG"
        resistance="10k"
        footprint="0603"
        pcbX={-10}
        pcbY={7}
        pcbRotation={90}
      />

      <resistor
        name="R_PH_POS"
        resistance="10k"
        footprint="0603"
        pcbX={60}
        pcbY={-7}
        pcbRotation={90}
      />
      <resistor
        name="R_PH_NEG"
        resistance="10k"
        footprint="0603"
        pcbX={60}
        pcbY={7}
        pcbRotation={90}
      />

      <trace from="J_VIA.BAT_POS" to="R_VIA_POS.pin1" />
      <trace from="J_VIA.BAT_NEG" to="R_VIA_NEG.pin1" />
      <trace from="R_VIA_POS.pin2" to="net.VIA_LOAD" />
      <trace from="R_VIA_NEG.pin2" to="net.VIA_LOAD" />

      <trace from="J_PH.BAT_POS" to="R_PH_POS.pin1" />
      <trace from="J_PH.BAT_NEG" to="R_PH_NEG.pin1" />
      <trace from="R_PH_POS.pin2" to="net.PH_LOAD" />
      <trace from="R_PH_NEG.pin2" to="net.PH_LOAD" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const jVia = circuit.selectOne(".J_VIA") as any
  const jPh = circuit.selectOne(".J_PH") as any

  const jViaDirectPorts = summarizeDirectPorts(jVia)
  const jPhDirectPorts = summarizeDirectPorts(jPh)

  const ambiguousRefs = circuit.db.source_ambiguous_port_reference.list()
  const notConnected = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "source_trace_not_connected_error")

  expect(jViaDirectPorts).toHaveLength(2)
  expect(jPhDirectPorts).toHaveLength(2)
  expect(ambiguousRefs).toHaveLength(0)
  expect(notConnected).toHaveLength(0)
})
