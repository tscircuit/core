import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels avoid parts and each other, hand-placed labels stay put", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm" routingDisabled>
      <pcbnotetext
        pcbX={0}
        pcbY={4.3}
        fontSize={0.45}
        text="Labels placed automatically; C9's label placed by hand (pcbSx)"
      />
      {Array.from({ length: 8 }, (_, i) => (
        <resistor
          key={`R${i + 1}`}
          name={`R${i + 1}`}
          resistance="10k"
          footprint="0402"
          pcbX={-5.6 + i * 1.6}
          pcbY={1.6}
          pcbRotation={90}
        />
      ))}
      <chip name="U1" footprint="soic8" pcbX={-3} pcbY={-2.2} />
      <capacitor
        name="C8"
        capacitance="100nF"
        footprint="0402"
        pcbX={0.4}
        pcbY={-2.2}
        pcbRotation={90}
      />
      <capacitor
        name="C9"
        capacitance="100nF"
        footprint="0402"
        pcbX={2.4}
        pcbY={-2.2}
        pcbRotation={90}
        pcbSx={{ "& silkscreentext": { pcbX: 0, pcbY: -1.2 } }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
