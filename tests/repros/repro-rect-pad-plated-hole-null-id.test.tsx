import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectPad plated holes share a null ID and move J1's port to J2", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} routingDisabled>
      {[-6, 6].map((pcbX, index) => (
        <chip
          key={pcbX}
          name={`J${index + 1}`}
          pcbX={pcbX}
          pcbY={3}
          schX={pcbX / 2}
          schY={2}
          pinLabels={{ pin1: ["IN"] }}
          footprint={
            <footprint>
              <platedhole
                portHints={["pin1"]}
                shape="pill"
                rectPad
                pcbRotation={0}
                holeWidth={1.2}
                holeHeight={1.2}
                outerWidth={1.8}
                outerHeight={1.8}
              />
              <silkscreentext text={`J${index + 1}.pin1`} pcbY={2} />
            </footprint>
          }
        />
      ))}
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-3}
        schX={-3}
        schY={-2}
      />
      <trace from=".R1 > .pin1" to=".J1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
  })
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
