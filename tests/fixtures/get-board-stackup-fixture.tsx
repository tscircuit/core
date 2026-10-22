import type { BoardProps } from "@tscircuit/props"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import simpleCircuitJson from "tests/components/normal-components/assets/simple-circuit.json"
import { getTestFixture } from "./get-test-fixture"

export const getBoardStackupFixture = async (boardProps: BoardProps) => {
  const { circuit } = getTestFixture()
  circuit.add(<board {...boardProps} />)
  await circuit.renderUntilSettled()
  return circuit
}

export const getImportedBoardCircuitJson = (
  boardOverrides: Partial<PcbBoard>,
) =>
  simpleCircuitJson.map((element) => {
    if (element.type === "pcb_board") {
      return { ...element, ...boardOverrides }
    }
    return element
  }) as AnyCircuitElement[]
