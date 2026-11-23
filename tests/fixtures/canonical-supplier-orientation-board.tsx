import { getTestFixture } from "./get-test-fixture"
import supplierFootprint from "./parts/C916374.circuit.json"
import type { AnyCircuitElement } from "circuit-json"

/** Recorded live C916374 supplier geometry; no assembly offset is inserted. */
export const getCanonicalSupplierOrientationBoard = async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: () => ({ jlcpcb: ["C916374"] }),
        fetchPartCircuitJson: () => supplierFootprint as AnyCircuitElement[],
      },
    },
  })
  circuit.add(
    <board width={52} height={26} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer, side) =>
        [0, 90, 180, 270].map((rotation, column) => (
          <chip
            key={`${layer}-${rotation}`}
            name={`U${side * 4 + column + 1}`}
            footprint="sot23"
            layer={layer}
            pcbRotation={rotation}
            pcbX={-18 + column * 12}
            pcbY={6 - side * 12}
            supplierPartNumbers={{ jlcpcb: ["C916374"] }}
          />
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit._getBoard()!
  for (const pcb of circuit.db.pcb_component.list()) {
    const source = circuit.db.source_component.get(pcb.source_component_id)!
    board.add(
      <pcbnotetext
        text={`${source.name}: ${pcb.layer} ${pcb.rotation}deg\n${pcb.pin1_location}`}
        pcbX={pcb.center.x}
        pcbY={pcb.center.y - 3.5}
        fontSize={0.65}
      />,
    )
  }
  await circuit.renderUntilSettled()
  return circuit
}
