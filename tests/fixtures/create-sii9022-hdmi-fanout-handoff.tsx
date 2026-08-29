import type { ChipProps, ConnectorProps } from "@tscircuit/props"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const sii9022PinLabels = {
  pin58: ["TXC_NEG"],
  pin59: ["TXC_POS"],
  pin61: ["TX0_NEG"],
  pin62: ["TX0_POS"],
  pin64: ["TX1_NEG"],
  pin65: ["TX1_POS"],
  pin67: ["TX2_NEG"],
  pin68: ["TX2_POS"],
} as const

const tpd12s016PinLabels = {
  pin15: ["CLK_NEG"],
  pin16: ["CLK_POS"],
  pin17: ["D0_NEG"],
  pin18: ["D0_POS"],
  pin20: ["D1_NEG"],
  pin21: ["D1_POS"],
  pin22: ["D2_NEG"],
  pin23: ["D2_POS"],
} as const

const hdmiPinLabels = {
  pin1: ["D2_POS"],
  pin3: ["D2_NEG"],
  pin4: ["D1_POS"],
  pin6: ["D1_NEG"],
  pin7: ["D0_POS"],
  pin9: ["D0_NEG"],
  pin10: ["CLK_POS"],
  pin12: ["CLK_NEG"],
} as const

const qfnPadPitch = 0.499872
const qfnPadInset = 4.249928
const qfnPadEdge = 4.907534
const pinNumberRange = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, offset) => first + offset)

const Sii9022Acnu = (props: ChipProps<typeof sii9022PinLabels>) => (
  <chip
    pinLabels={sii9022PinLabels}
    manufacturerPartNumber="SII9022ACNU"
    supplierPartNumbers={{ jlcpcb: ["C369565"] }}
    footprint={
      <footprint>
        {pinNumberRange(1, 18).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={-qfnPadInset + (pinNumber - 1) * qfnPadPitch}
            pcbY={-qfnPadEdge}
            width="0.28mm"
            height="0.665mm"
            shape="rect"
          />
        ))}
        {pinNumberRange(19, 36).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={qfnPadEdge}
            pcbY={-qfnPadInset + (pinNumber - 19) * qfnPadPitch}
            width="0.665mm"
            height="0.28mm"
            shape="rect"
          />
        ))}
        {pinNumberRange(37, 54).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={qfnPadInset - (pinNumber - 37) * qfnPadPitch}
            pcbY={qfnPadEdge}
            width="0.28mm"
            height="0.665mm"
            shape="rect"
          />
        ))}
        {pinNumberRange(55, 72).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={-qfnPadEdge}
            pcbY={qfnPadInset - (pinNumber - 55) * qfnPadPitch}
            width="0.665mm"
            height="0.28mm"
            shape="rect"
          />
        ))}
        <smtpad
          portHints={["pin73"]}
          pcbX={0}
          pcbY={0}
          width="4.7mm"
          height="4.7mm"
          shape="rect"
        />
      </footprint>
    }
    {...props}
  />
)

const tssopPadPitch = 0.649986
const tssopPadInset = 3.574796

const Tpd12s016Pwr = (props: ChipProps<typeof tpd12s016PinLabels>) => (
  <chip
    pinLabels={tpd12s016PinLabels}
    manufacturerPartNumber="TPD12S016PWR"
    supplierPartNumbers={{ jlcpcb: ["C201665"] }}
    footprint={
      <footprint>
        {pinNumberRange(1, 12).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={-tssopPadInset + (pinNumber - 1) * tssopPadPitch}
            pcbY={-3.0226}
            width="0.4mm"
            height="1.65mm"
            shape="rect"
          />
        ))}
        {pinNumberRange(13, 24).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={tssopPadInset - (pinNumber - 13) * tssopPadPitch}
            pcbY={3.0226}
            width="0.4mm"
            height="1.65mm"
            shape="rect"
          />
        ))}
      </footprint>
    }
    {...props}
  />
)

const Hdmi001s = (props: ConnectorProps) => (
  <connector
    pinLabels={hdmiPinLabels}
    pinCount={19}
    manufacturerPartNumber="HDMI-001S"
    supplierPartNumbers={{ jlcpcb: ["C720616"] }}
    footprint={
      <footprint>
        {pinNumberRange(1, 19).map((pinNumber) => (
          <smtpad
            key={`pin${pinNumber}`}
            portHints={[`pin${pinNumber}`]}
            pcbX={4.499991 - (pinNumber - 1) * qfnPadPitch}
            pcbY={2.73504}
            width="0.3mm"
            height="2.6mm"
            shape="rect"
          />
        ))}
        <platedhole
          portHints={["pin20"]}
          pcbX={-7.250049}
          pcbY={1.9750723}
          holeWidth="1mm"
          holeHeight="3mm"
          outerWidth="1.5mm"
          outerHeight="3.5mm"
          shape="pill"
        />
        <platedhole
          portHints={["pin21"]}
          pcbX={7.250049}
          pcbY={1.9750723}
          holeWidth="1mm"
          holeHeight="3mm"
          outerWidth="1.5mm"
          outerHeight="3.5mm"
          shape="pill"
        />
        <platedhole
          portHints={["pin22"]}
          pcbX={-7.250049}
          pcbY={-3.9850377}
          holeWidth="1mm"
          holeHeight="1.8mm"
          outerWidth="1.5mm"
          outerHeight="2.3mm"
          shape="pill"
        />
        <platedhole
          portHints={["pin23"]}
          pcbX={7.250049}
          pcbY={-3.9850377}
          holeWidth="1mm"
          holeHeight="1.8mm"
          outerWidth="1.5mm"
          outerHeight="2.3mm"
          shape="pill"
        />
      </footprint>
    }
    {...props}
  />
)

const tmdsConnections = [
  ["TMDS_D2_P", "TX2_POS", "D2_POS", "pin1", "TMDS_PAIR_0"],
  ["TMDS_D2_N", "TX2_NEG", "D2_NEG", "pin3", "TMDS_PAIR_0"],
  ["TMDS_D1_P", "TX1_POS", "D1_POS", "pin4", "TMDS_PAIR_1"],
  ["TMDS_D1_N", "TX1_NEG", "D1_NEG", "pin6", "TMDS_PAIR_1"],
  ["TMDS_D0_P", "TX0_POS", "D0_POS", "pin7", "TMDS_PAIR_2"],
  ["TMDS_D0_N", "TX0_NEG", "D0_NEG", "pin9", "TMDS_PAIR_2"],
  ["TMDS_CLK_P", "TXC_POS", "CLK_POS", "pin10", "TMDS_PAIR_3"],
  ["TMDS_CLK_N", "TXC_NEG", "CLK_NEG", "pin12", "TMDS_PAIR_3"],
] as const

export const renderSii9022HdmiFanoutHandoff = async () => {
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
      <autoroutingphase
        name="ROUTE_TMDS_BRIDGE_ALL"
        phaseIndex={-9.91}
        autorouter="default"
        region={{ minX: -23, maxX: 27, minY: -5.5, maxY: 7.5 }}
      />

      <Sii9022Acnu name="U5" pcbX={-22} pcbRotation={180} />
      <Tpd12s016Pwr name="U6" pcbRotation={270} />
      <Hdmi001s name="J2" pcbX={22} pcbY={-2.25} pcbRotation={90} />

      <fanout
        name="HDMI_BRIDGE_TMDS_ESCAPE"
        autorouter={{ preset: "single_layer_fanout", allowViaInPad: false }}
        fanoutBoundaryPadding="8mm"
        fanoutRoutingLayers={["top"]}
      >
        {tmdsConnections.map(([, u5Pin], connectionIndex) => (
          <fanoutpoint
            key={u5Pin}
            connection={`.U5 > .${u5Pin}`}
            pcbX={-12}
            pcbY={-2.750058 + connectionIndex * 0.5}
          />
        ))}
      </fanout>

      {["TMDS_PAIR_0", "TMDS_PAIR_1", "TMDS_PAIR_2", "TMDS_PAIR_3"].map(
        (busName) => (
          <bus
            key={busName}
            name={busName}
            connections={tmdsConnections
              .filter(
                ([, , , , connectionBusName]) => connectionBusName === busName,
              )
              .map(([traceName]) => `${traceName}_BRIDGE`)}
            routingPhaseIndex={-9.91}
            maxLengthSkew="0.5mm"
            pcbTraceWidth="0.15mm"
            pcbAllowedLayers={["top"]}
          />
        ),
      )}

      {tmdsConnections.map(([traceName, u5Pin, u6Pin, hdmiPin]) => (
        <Fragment key={traceName}>
          <trace
            name={`${traceName}_BRIDGE`}
            from={`.U5 > .${u5Pin}`}
            to={`.U6 > .${u6Pin}`}
            routingPhaseIndex={-9.91}
          />
          <trace
            name={`${traceName}_CONNECTOR`}
            from={`.U6 > .${u6Pin}`}
            to={`.J2 > .${hdmiPin}`}
            routingPhaseIndex={-9.91}
          />
        </Fragment>
      ))}

      <pcbnotetext
        text="SII9022ACNU → TPD12S016PWR → HDMI-001S: 8 TMDS NETS"
        pcbY={10.5}
        fontSize="0.6mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  return { circuit, autoroutingPhaseIoStack }
}
