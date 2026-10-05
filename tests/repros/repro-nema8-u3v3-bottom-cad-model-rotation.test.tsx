import { expect, test } from "bun:test"
import type { CadComponent, PcbComponent, PcbPort } from "circuit-json"
import { getBestCameraPosition } from "circuit-json-to-gltf"
import type { RootCircuit } from "lib/RootCircuit"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type OrientationWitness = {
  componentName: string
  matchingPortName: string
  label: string
  labelPosition: { x: number; y: number }
}

const createNema8RotationElements = (layer: "top" | "bottom") => (
  <>
    <chip
      name="U_3V3"
      layer={layer}
      pcbX={-5}
      pcbY={2}
      pcbRotation={90}
      pinLabels={{ pin1: "GND", pin2: "VOUT", pin3: "VIN" }}
      footprint="sot23w_p1.23mm_pw0.6mm_pl1.07mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2829401.obj?uuid=cefd4596db214da394d9632b2b88f8f2",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0.0000127, y: 0, z: 0 },
      }}
    />
    <diode
      name="D_LOGIC_PD"
      layer={layer}
      pcbX={-3}
      pcbY={-2}
      pcbRotation={90}
      pinLabels={{ pin1: "cathode", pin2: "anode" }}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "cathode"]}
            points={[
              { x: -1.016, y: 0.2463038 },
              { x: -0.4064, y: 0.2463038 },
              { x: -0.4064, y: -0.2362962 },
              { x: -1.016, y: -0.2362962 },
            ]}
            shape="polygon"
          />
          <smtpad
            portHints={["pin2", "anode"]}
            points={[
              { x: 0.4064, y: 0.2362962 },
              { x: 1.016, y: 0.2362962 },
              { x: 1.016, y: -0.2463038 },
              { x: 0.4064, y: -0.2463038 },
            ]}
            shape="polygon"
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C283259.obj?uuid=84cf6c2b182949329e473e9158b1fb00",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.0040386, z: 0 },
      }}
    />
    <diode
      name="D_LOGIC_USB"
      layer={layer}
      pcbX={3}
      pcbY={-2}
      pcbRotation={90}
      pinLabels={{ pin1: "cathode", pin2: "anode" }}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "cathode"]}
            pcbX={-1.139952}
            width={0.8299958}
            height={0.6299962}
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "anode"]}
            pcbX={1.139952}
            width={0.8299958}
            height={0.6299962}
            shape="rect"
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C7502694.obj?uuid=ca55f7f4aa2143938eb241550bbe4129",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.55 },
      }}
    />
  </>
)

const createNema8RotationBoard = (layer: "top" | "bottom") => (
  <board width={18} height={11} routingDisabled>
    {createNema8RotationElements(layer)}
  </board>
)

const getOrientationElements = ({
  circuit,
  componentName,
  matchingPortName,
}: {
  circuit: RootCircuit
  componentName: string
  matchingPortName: string
}): {
  cadComponent: CadComponent
  pcbComponent: PcbComponent
  matchingPcbPort: PcbPort
} => {
  const sourceComponent = circuit.db.source_component.getWhere({
    name: componentName,
  })!
  const matchingSourcePort = circuit.db.source_port
    .list({ source_component_id: sourceComponent.source_component_id })
    .find(
      (sourcePort) =>
        sourcePort.name === matchingPortName ||
        sourcePort.port_hints?.includes(matchingPortName),
    )!

  return {
    cadComponent: circuit.db.cad_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!,
    pcbComponent: circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!,
    matchingPcbPort: circuit.db.pcb_port.getWhere({
      source_port_id: matchingSourcePort.source_port_id,
    })!,
  }
}

/**
 * The witness comes from emitted PCB geometry: center-to-pin line plus a ring
 * on electrical pin 1/cathode. The snapshot compares that geometry with each
 * real OBJ's molded dot or cathode stripe.
 */
const addPcbPinOrientationWitness = ({
  circuit,
  layer,
  witness,
}: {
  circuit: RootCircuit
  layer: "top" | "bottom"
  witness: OrientationWitness
}) => {
  const { cadComponent, pcbComponent, matchingPcbPort } =
    getOrientationElements({
      circuit,
      componentName: witness.componentName,
      matchingPortName: witness.matchingPortName,
    })

  circuit.db.pcb_silkscreen_path.insert({
    pcb_component_id: pcbComponent.pcb_component_id,
    layer,
    route: [
      pcbComponent.center,
      { x: matchingPcbPort.x, y: matchingPcbPort.y },
    ],
    stroke_width: 0.16,
  })
  circuit.db.pcb_silkscreen_circle.insert({
    pcb_component_id: pcbComponent.pcb_component_id,
    layer,
    center: { x: matchingPcbPort.x, y: matchingPcbPort.y },
    radius: 0.48,
    stroke_width: 0.16,
  })
  circuit.db.pcb_silkscreen_text.insert({
    pcb_component_id: pcbComponent.pcb_component_id,
    layer,
    font: "tscircuit2024",
    font_size: 0.38,
    text: witness.label,
    ccw_rotation: layer === "top" ? 180 : 0,
    anchor_alignment: "center",
    anchor_position: witness.labelPosition,
  })

  return {
    componentName: witness.componentName,
    cadRotation: cadComponent.rotation,
  }
}

test("NEMA8 U_3V3 bottom CAD rotation matches pin 1", async () => {
  const { circuit: bottomCircuit } = getTestFixture()
  const { circuit: topReferenceCircuit } = getTestFixture()

  bottomCircuit.add(createNema8RotationBoard("bottom"))
  topReferenceCircuit.add(createNema8RotationBoard("top"))
  await bottomCircuit.renderUntilSettled()
  await topReferenceCircuit.renderUntilSettled()

  const witnesses: OrientationWitness[] = [
    {
      componentName: "U_3V3",
      matchingPortName: "pin1",
      label: "U_3V3: DOT = PIN 1",
      labelPosition: { x: -5, y: 4.3 },
    },
    {
      componentName: "D_LOGIC_PD",
      matchingPortName: "pin1",
      label: "D_LOGIC_PD CONTROL",
      labelPosition: { x: -3, y: -3.5 },
    },
    {
      componentName: "D_LOGIC_USB",
      matchingPortName: "pin1",
      label: "D_LOGIC_USB CONTROL",
      labelPosition: { x: 3, y: -4.6 },
    },
  ]

  const bottomOrientations = witnesses.map((witness) =>
    addPcbPinOrientationWitness({
      circuit: bottomCircuit,
      layer: "bottom",
      witness,
    }),
  )
  const topReferenceOrientations = witnesses.map((witness) =>
    addPcbPinOrientationWitness({
      circuit: topReferenceCircuit,
      layer: "top",
      witness,
    }),
  )

  const bottomCamera = getBestCameraPosition(bottomCircuit.getCircuitJson(), {
    preset: "bottom_up",
    ortho: true,
    aspectRatio: 1,
  })
  await expect(bottomCircuit).toMatch3dSnapshot(import.meta.path, {
    camPos: [...bottomCamera.camPos],
    poppygl: {
      lookAt: [...bottomCamera.lookAt],
      fov: bottomCamera.fov,
    },
    snapshotSuffix: "bottom-pin1-marked",
  })
  await expect(topReferenceCircuit).toMatch3dSnapshot(import.meta.path, {
    cameraPreset: "top_down_orthographic",
    snapshotSuffix: "top-reference-pin1-marked",
  })

  expect(bottomOrientations).toEqual([
    { componentName: "U_3V3", cadRotation: { x: 0, y: 180, z: 0 } },
    { componentName: "D_LOGIC_PD", cadRotation: { x: 0, y: 180, z: 270 } },
    {
      componentName: "D_LOGIC_USB",
      cadRotation: { x: 0, y: 180, z: 270 },
    },
  ])
  expect(topReferenceOrientations).toEqual([
    { componentName: "U_3V3", cadRotation: { x: 0, y: 0, z: 180 } },
    { componentName: "D_LOGIC_PD", cadRotation: { x: 0, y: 0, z: 90 } },
    { componentName: "D_LOGIC_USB", cadRotation: { x: 0, y: 0, z: 90 } },
  ])
}, 60_000)
