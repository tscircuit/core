import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const allowedCircuitJsonMaterials = ["fr4", "fr1"]

const createReproBoard = (observedMaterial?: string) => {
  const status = allowedCircuitJsonMaterials.includes(observedMaterial ?? "")
    ? "correct"
    : "failing"

  return (
    <board width="20mm" height="10mm" material="flex">
      <pcbnotetext
        pcbY={0}
        fontSize={0.7}
        text={`requested material: flex\nallowed Circuit JSON materials: ${JSON.stringify(allowedCircuitJsonMaterials)}\nobserved material: ${observedMaterial}\nstatus: ${status}`}
      />
    </board>
  )
}

test.failing(
  "board should reject material flex until Circuit JSON supports it",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(createReproBoard())
    circuit.render()

    const board = circuit.db.pcb_board.list()[0]

    const { circuit: snapshotCircuit } = getTestFixture()
    snapshotCircuit.add(createReproBoard(board?.material))
    snapshotCircuit.render()

    expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
    expect(board?.material).not.toBe("flex")
  },
)
