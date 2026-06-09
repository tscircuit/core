import type { ChipProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["EN"],
  pin2: ["MODE"],
  pin3: ["AGND"],
  pin4: ["FB"],
  pin5: ["PG"],
  pin6: ["VOUT"],
  pin7: ["L2"],
  pin8: ["GND"],
  pin9: ["L1"],
  pin10: ["VIN"],
} as const

export const TPS63802DLAR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2845237"],
      }}
      manufacturerPartNumber="TPS63802DLAR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin10"]}
            pcbX="0.74994135mm"
            pcbY="0.999998mm"
            width="0.8999982mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="0.74994135mm"
            pcbY="0.499872mm"
            width="0.8999982mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.55004335mm"
            pcbY="0mm"
            width="1.2999974mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.74994135mm"
            pcbY="-0.500126mm"
            width="0.8999982mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.74994135mm"
            pcbY="-0.999998mm"
            width="0.8999982mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.90004265mm"
            pcbY="-0.999998mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.90004265mm"
            pcbY="-0.500126mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.90004265mm"
            pcbY="0mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.90004265mm"
            pcbY="0.499872mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.90004265mm"
            pcbY="0.999998mm"
            width="0.5999988mm"
            height="0.2999994mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.0680255500000158, y: 1.330121800000029 },
              { x: 1.0680255500000158, y: 1.5240000000001146 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0909744500000897, y: -1.330121800000029 },
              { x: -1.0909744500000897, y: -1.5239999999998872 },
              { x: 1.0680255500000158, y: -1.5239999999998872 },
              { x: 1.0680255500000158, y: -1.330121800000029 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.0680255500000158, y: 1.5240000000001146 },
              { x: -1.0909744500000897, y: 1.5240000000001146 },
              { x: -1.0909744500000897, y: 1.330121800000029 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.297044650000089, y: 1.5240000000001146 },
              { x: -1.3004546570083448, y: 1.4980984252424605 },
              { x: -1.3104522916909218, y: 1.4739620000000286 },
              { x: -1.326356231765999, y: 1.45323558176608 },
              { x: -1.3470826499998338, y: 1.437331641691003 },
              { x: -1.3712190752423794, y: 1.427334007008426 },
              { x: -1.3971206500000335, y: 1.42392400000017 },
              { x: -1.4230222247576876, y: 1.427334007008426 },
              { x: -1.4471586500000058, y: 1.437331641691003 },
              { x: -1.467885068234068, y: 1.45323558176608 },
              { x: -1.4837890083091452, y: 1.4739620000000286 },
              { x: -1.4937866429917221, y: 1.4980984252424605 },
              { x: -1.497196649999978, y: 1.5240000000001146 },
              { x: -1.4937866429917221, y: 1.5499015747577687 },
              { x: -1.4837890083091452, y: 1.5740380000000869 },
              { x: -1.467885068234068, y: 1.5947644182340355 },
              { x: -1.4471586500000058, y: 1.6106683583091126 },
              { x: -1.4230222247576876, y: 1.6206659929916896 },
              { x: -1.3971206500000335, y: 1.6240760000000591 },
              { x: -1.3712190752423794, y: 1.6206659929916896 },
              { x: -1.3470826499998338, y: 1.6106683583091126 },
              { x: -1.326356231765999, y: 1.5947644182340355 },
              { x: -1.3104522916909218, y: 1.5740380000000869 },
              { x: -1.3004546570083448, y: 1.5499015747577687 },
              { x: -1.297044650000089, y: 1.5240000000001146 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.14972665mm"
            pcbY="2.63576mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.7459266500000012, y: 1.8857600000000048 },
              { x: 1.4464733499999056, y: 1.8857600000000048 },
              { x: 1.4464733499999056, y: -1.7638399999999592 },
              { x: -1.7459266500000012, y: -1.7638399999999592 },
              { x: -1.7459266500000012, y: 1.8857600000000048 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2845237.obj?uuid=aaec7da25c23451ca65c9907eea57d42",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2845237.step?uuid=aaec7da25c23451ca65c9907eea57d42",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.07497445000001335, y: 0, z: -0.95 },
      }}
      {...props}
    />
  )
}

export const TPS63802 = () => (
  <subcircuit name="TPS63802_3V3_BuckBoost" routingDisabled>
    <TPS63802DLAR
      name="U1"
      schX={0}
      schY={0}
      schWidth={2.8}
      schHeight={5.4}
      showPinAliases={false}
      schPinArrangement={{
        topSide: { pins: ["L1", "L2"], direction: "left-to-right" },
        leftSide: {
          pins: ["VIN", "EN", "MODE", "GND"],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: ["VOUT", "PG", "FB", "AGND"],
          direction: "top-to-bottom",
        },
      }}
      schPinStyle={{
        L2: { marginLeft: 1 },
        VIN: { marginBottom: 0.45 },
        EN: { marginBottom: 0.45 },
        MODE: { marginBottom: 0.45 },
        VOUT: { marginBottom: 0.45 },
        PG: { marginBottom: 0.45 },
        FB: { marginBottom: 0.45 },
      }}
    />

    <inductor
      name="L1"
      inductance={4.7e-7}
      footprint="0603"
      schX={0}
      schY={3.1}
      schOrientation="horizontal"
    />

    <capacitor
      name="C1"
      capacitance="10uF"
      footprint="0603"
      schX={-4.5}
      schY={-0.35}
      schOrientation="vertical"
    />

    <capacitor
      name="C2"
      capacitance="22uF"
      footprint="0805"
      schX={3.4}
      schY={-0.35}
      schOrientation="vertical"
    />

    <resistor
      name="R1"
      resistance="511k"
      footprint="0603"
      schX={2.25}
      schY={-0.35}
      schOrientation="vertical"
    />

    <resistor
      name="R2"
      resistance="91k"
      footprint="0603"
      schX={2.25}
      schY={-2.1}
      schOrientation="vertical"
    />

    <resistor
      name="R3"
      resistance="100k"
      footprint="0603"
      schX={1.55}
      schY={0.8}
      schOrientation="vertical"
    />

    <netlabel
      net="VIN"
      connection="U1.VIN"
      schX={-5.9}
      schY={1.25}
      anchorSide="right"
    />
    <schematictext
      text="VIN 1.3V-5.5V"
      schX={-6}
      schY={1.75}
      fontSize={0.18}
      anchor="center"
    />
    <netlabel
      net="VOUT"
      connection="C2.pin1"
      schX={4.5}
      schY={1.25}
      anchorSide="left"
    />
    <schematictext
      text="VOUT = 3.3V"
      schX={3.8}
      schY={1.75}
      fontSize={0.18}
      anchor="center"
    />
    <netlabel
      net="GND"
      connection="U1.GND"
      schX={0}
      schY={-3.25}
      anchorSide="top"
    />

    <netlabel
      net="PG"
      connection="U1.PG"
      schX={1.15}
      schY={0.25}
      anchorSide="left"
    />

    <trace from="U1.L1" to="L1.pin1" />
    <trace from="U1.L2" to="L1.pin2" />

    <trace from="U1.VIN" to="C1.pin1" />
    <trace from="U1.VIN" to="U1.EN" />
    <trace from="U1.VIN" to="R3.pin1" />

    <trace from="U1.VOUT" to="C2.pin1" />
    <trace from="U1.VOUT" to="R1.pin1" />

    <trace from="U1.PG" to="R3.pin2" schDisplayLabel="PG" />
    <trace from="U1.FB" to="R1.pin2" schDisplayLabel="FB" />
    <trace from="U1.FB" to="R2.pin1" />

    <trace from="U1.MODE" to="net.GND" />
    <trace from="U1.GND" to="net.GND" />
    <trace from="U1.AGND" to="net.GND" />
    <trace from="C1.pin2" to="net.GND" />
    <trace from="C2.pin2" to="net.GND" />
    <trace from="R2.pin2" to="net.GND" />
  </subcircuit>
)

export default TPS63802

test("repro126: TPS63802 schematic snapshot", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm" routingDisabled>
      <TPS63802 />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
