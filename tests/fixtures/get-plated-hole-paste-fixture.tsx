import { getTestFixture } from "./get-test-fixture"

export const getPlatedHolePasteFixture = () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12}>
      <platedhole
        name="vertical_slot"
        shape="pill"
        outerWidth={1.524}
        outerHeight={2.2}
        holeWidth={0.914}
        holeHeight={1.5}
        pcbX={-4}
      />
      <platedhole
        name="rotated_slot"
        shape="pill"
        outerWidth={1.524}
        outerHeight={2.2}
        holeWidth={0.914}
        holeHeight={1.5}
        pcbX={4}
        pcbRotation={90}
      />
      <platedhole
        name="round_hole"
        shape="circle"
        outerDiameter={1.5}
        holeDiameter={0.8}
        pcbY={-3}
      />
      <chip
        name="U_SMD"
        pcbY={3}
        footprint={
          <footprint>
            <smtpad shape="circle" radius={0.75} />
          </footprint>
        }
      />
      <pcbnotetext
        text="THT paste: slots at 0 and 90 deg"
        pcbY={5}
        fontSize={0.6}
      />
    </board>,
  )
  circuit.render()
  return circuit
}
