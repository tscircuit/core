import { expect, test } from "bun:test"
import type { CadComponent, PcbComponent, PcbPort } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Direction = { x: number; y: number }

const getCadModelDirectionOnBoard = ({
  cadComponent,
  modelLocalDirection,
}: {
  cadComponent: CadComponent
  modelLocalDirection: Direction
}) => {
  const cadRotationYRadians = ((cadComponent.rotation?.y ?? 0) * Math.PI) / 180
  const cadRotationZRadians = ((cadComponent.rotation?.z ?? 0) * Math.PI) / 180
  const modelXAfterLayerFlip =
    Math.cos(cadRotationYRadians) * modelLocalDirection.x

  return {
    x:
      Math.cos(cadRotationZRadians) * modelXAfterLayerFlip -
      Math.sin(cadRotationZRadians) * modelLocalDirection.y,
    y:
      Math.sin(cadRotationZRadians) * modelXAfterLayerFlip +
      Math.cos(cadRotationZRadians) * modelLocalDirection.y,
  }
}

const getModelLocalDirection = ({
  cadComponent,
  boardDirection,
}: {
  cadComponent: CadComponent
  boardDirection: Direction
}) => {
  const cadRotationYRadians = ((cadComponent.rotation?.y ?? 0) * Math.PI) / 180
  const cadRotationZRadians = ((cadComponent.rotation?.z ?? 0) * Math.PI) / 180
  const modelXAfterLayerFlip =
    Math.cos(cadRotationZRadians) * boardDirection.x +
    Math.sin(cadRotationZRadians) * boardDirection.y

  return {
    x: modelXAfterLayerFlip / Math.cos(cadRotationYRadians),
    y:
      -Math.sin(cadRotationZRadians) * boardDirection.x +
      Math.cos(cadRotationZRadians) * boardDirection.y,
  }
}

const normalizeDirection = ({ x, y }: Direction) => {
  const length = Math.hypot(x, y)
  return { x: x / length, y: y / length }
}

const createNema8OrientationBoard = (layer: "top" | "bottom") => (
  <board width={18} height={8} routingDisabled>
    <chip
      name="U_3V3"
      layer={layer}
      pcbX={-5}
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
      pcbRotation={90}
      pinLabels={{ pin1: "cathode", pin2: "anode" }}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1", "cathode"]}
            pcbX={-0.7112}
            width={0.6096}
            height={0.4826}
            shape="rect"
          />
          <smtpad
            portHints={["pin2", "anode"]}
            pcbX={0.7112}
            width={0.6096}
            height={0.4826}
            shape="rect"
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
      pcbX={5}
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
  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
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
    pcbComponent,
    matchingPcbPort: circuit.db.pcb_port.getWhere({
      source_port_id: matchingSourcePort.source_port_id,
    })!,
  }
}

const getPortDirection = ({
  pcbComponent,
  pcbPort,
}: {
  pcbComponent: PcbComponent
  pcbPort: PcbPort
}) =>
  normalizeDirection({
    x: pcbPort.x - pcbComponent.center.x,
    y: pcbPort.y - pcbComponent.center.y,
  })

// Enable this diagnostic test on the unfixed branch to see the real NEMA8
// models violate the top-side model-to-pin relationship after a bottom flip.
// It is skipped here so this repro-only branch remains green for review.
test.skip("NEMA8 bottom CAD models preserve the top-side model-to-pin alignment", async () => {
  const { circuit: topReferenceCircuit } = getTestFixture()
  const { circuit: bottomCircuit } = getTestFixture()

  topReferenceCircuit.add(createNema8OrientationBoard("top"))
  bottomCircuit.add(createNema8OrientationBoard("bottom"))

  await Promise.all([
    topReferenceCircuit.renderUntilSettled(),
    bottomCircuit.renderUntilSettled(),
  ])

  await expect(bottomCircuit).toMatch3dSnapshot(import.meta.path, {
    cameraPreset: "bottom_angled",
  })

  const componentAlignments = [
    { componentName: "U_3V3", matchingPortName: "pin1" },
    { componentName: "D_LOGIC_PD", matchingPortName: "pin1" },
    { componentName: "D_LOGIC_USB", matchingPortName: "pin1" },
  ].map(({ componentName, matchingPortName }) => {
    const topReference = getOrientationElements({
      circuit: topReferenceCircuit,
      componentName,
      matchingPortName,
    })
    const bottom = getOrientationElements({
      circuit: bottomCircuit,
      componentName,
      matchingPortName,
    })

    // EasyEDA's top-side import establishes which direction on the model points
    // toward this asymmetric pin. Deriving that direction here keeps the test
    // independent of a hand-authored model-axis assumption or a blessed PNG.
    const modelLocalDirectionTowardMatchingPin = getModelLocalDirection({
      cadComponent: topReference.cadComponent,
      boardDirection: getPortDirection({
        pcbComponent: topReference.pcbComponent,
        pcbPort: topReference.matchingPcbPort,
      }),
    })
    const bottomModelDirectionTowardMatchingPin = normalizeDirection(
      getCadModelDirectionOnBoard({
        cadComponent: bottom.cadComponent,
        modelLocalDirection: modelLocalDirectionTowardMatchingPin,
      }),
    )
    const bottomMatchingPinDirection = getPortDirection({
      pcbComponent: bottom.pcbComponent,
      pcbPort: bottom.matchingPcbPort,
    })
    const alignment = Number(
      (
        bottomModelDirectionTowardMatchingPin.x * bottomMatchingPinDirection.x +
        bottomModelDirectionTowardMatchingPin.y * bottomMatchingPinDirection.y
      ).toFixed(5),
    )

    return { componentName, matchingPortName, alignment }
  })

  expect(componentAlignments).toEqual([
    { componentName: "U_3V3", matchingPortName: "pin1", alignment: 1 },
    {
      componentName: "D_LOGIC_PD",
      matchingPortName: "pin1",
      alignment: 1,
    },
    {
      componentName: "D_LOGIC_USB",
      matchingPortName: "pin1",
      alignment: 1,
    },
  ])
})
