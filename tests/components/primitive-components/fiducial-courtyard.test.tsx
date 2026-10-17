import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fiducial courtyard rendering", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <chip name="F1">
        <fiducial name="FM1" pcbX={2} pcbY={3} padDiameter="0.8mm" />
      </chip>
      <pcbnotetext
        fontSize={0.35}
        text="Fiducial soldermask opening"
        pcbY={-3}
      />
    </board>,
  )
  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    showSolderMask: true,
  })
})
