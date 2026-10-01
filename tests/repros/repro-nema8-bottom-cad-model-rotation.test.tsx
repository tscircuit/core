import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type ModelDirection = { x: number; y: number }

const getCadModelDirectionOnBoard = ({
  cadComponent,
  modelLocalDirection,
}: {
  cadComponent: CadComponent
  modelLocalDirection: ModelDirection
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

const normalizeDirection = ({ x, y }: ModelDirection) => {
  const length = Math.hypot(x, y)
  return { x: x / length, y: y / length }
}

// Enable this diagnostic test on the unfixed branch to see the three bottom
// models face away from their corresponding asymmetric pad geometry. It stays
// skipped so the stacked fix can share this exact NEMA8 board reproduction.
test.skip("repro: NEMA8 bottom CAD models rotate away from their pads", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={18} height={8} routingDisabled>
      <chip
        name="U_3V3"
        layer="bottom"
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
        layer="bottom"
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
        layer="bottom"
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
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    cameraPreset: "bottom_angled",
  })

  const componentAlignments = [
    {
      componentName: "U_3V3",
      modelLocalDirection: { x: 0, y: 1 },
      matchingPortName: "pin3",
    },
    {
      componentName: "D_LOGIC_PD",
      modelLocalDirection: { x: -1, y: 0 },
      matchingPortName: "pin1",
    },
    {
      componentName: "D_LOGIC_USB",
      modelLocalDirection: { x: -1, y: 0 },
      matchingPortName: "pin1",
    },
  ].map(({ componentName, modelLocalDirection, matchingPortName }) => {
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
    const matchingPcbPort = circuit.db.pcb_port.getWhere({
      source_port_id: matchingSourcePort.source_port_id,
    })!
    const cadComponent = circuit.db.cad_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const cadModelDirectionOnBoard = normalizeDirection(
      getCadModelDirectionOnBoard({ cadComponent, modelLocalDirection }),
    )
    const matchingPcbPortDirection = normalizeDirection({
      x: matchingPcbPort.x - pcbComponent.center.x,
      y: matchingPcbPort.y - pcbComponent.center.y,
    })
    const alignment = Number(
      (
        cadModelDirectionOnBoard.x * matchingPcbPortDirection.x +
        cadModelDirectionOnBoard.y * matchingPcbPortDirection.y
      ).toFixed(5),
    )

    return { componentName, alignment }
  })

  expect(componentAlignments).toEqual([
    { componentName: "U_3V3", alignment: 1 },
    { componentName: "D_LOGIC_PD", alignment: 1 },
    { componentName: "D_LOGIC_USB", alignment: 1 },
  ])
})
