import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  Hdmi001s,
  Sii9022Acnu,
  Tpd12s016Pwr,
  tmdsConnections,
} from "./create-sii9022-hdmi-fanout-handoff"

const tmdsBusNames = [
  "TMDS_PAIR_0",
  "TMDS_PAIR_1",
  "TMDS_PAIR_2",
  "TMDS_PAIR_3",
] as const
const tmdsRoutingPhaseByBus = {
  TMDS_PAIR_0: -10.3,
  TMDS_PAIR_1: -10.2,
  TMDS_PAIR_2: -10.1,
  TMDS_PAIR_3: -10,
} as const

export const renderSii9022HdmiAutomaticFanoutPhases = async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="70mm"
      height="24mm"
      layers={4}
      autorouterVersion="beta_pipeline9"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
    >
      {tmdsBusNames.map((busName) => (
        <Fragment key={`FANOUT_SII9022_${busName}`}>
          <autoroutingphase
            name={`FANOUT_SII9022_${busName}`}
            phaseIndex={tmdsRoutingPhaseByBus[busName]}
            autorouter={{
              preset: "single_layer_fanout",
              allowViaInPad: false,
            }}
            fanoutBoundaryPadding="8mm"
            fanoutRoutingLayers={["top"]}
            busFanoutDirections={{ [busName]: "rightside_center" }}
          />
        </Fragment>
      ))}
      <autoroutingphase
        name="ROUTE_HDMI_HPD_CONNECTOR"
        phaseIndex={-9.9}
        autorouter="default"
        region={{ minX: -5, maxX: 30, minY: -9, maxY: 8 }}
      />

      <Sii9022Acnu name="U5" pcbX={-22} pcbRotation={180} />
      <Tpd12s016Pwr name="U6" pcbRotation={0} />
      <Hdmi001s name="J2" pcbX={22} pcbY={-2.25} pcbRotation={90} />

      {tmdsBusNames.map((busName) => (
        <Fragment key={busName}>
          <bus
            name={busName}
            connections={tmdsConnections
              .filter(
                ([, , , , connectionBusName]) => connectionBusName === busName,
              )
              .map(([traceName]) => `${traceName}_BRIDGE`)}
            routingPhaseIndex={tmdsRoutingPhaseByBus[busName]}
            maxLengthSkew="0.5mm"
            pcbTraceWidth="0.15mm"
            pcbAllowedLayers={["top"]}
          />
        </Fragment>
      ))}

      {tmdsConnections.map(([traceName, u5Pin, u6Pin, , busName]) => (
        <Fragment key={traceName}>
          <trace
            name={`${traceName}_BRIDGE`}
            from={`.U5 > .${u5Pin}`}
            to={`.U6 > .${u6Pin}`}
            routingPhaseIndex={tmdsRoutingPhaseByBus[busName]}
          />
        </Fragment>
      ))}
      <trace
        name="HDMI_HPD_CONNECTOR"
        from=".U6 > .HPD_B_NEG"
        to=".J2 > .HPD"
        routingPhaseIndex={-9.9}
      />

      <pcbnotetext
        text="SII9022 AUTOMATIC TMDS FANOUT → TPD12S016 → HDMI HPD"
        pcbY={10.5}
        fontSize="0.6mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  return { circuit, autoroutingPhaseIoStack }
}
