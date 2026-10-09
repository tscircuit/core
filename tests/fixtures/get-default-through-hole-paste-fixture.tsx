import { getTestFixture } from "./get-test-fixture"

export const getDefaultThroughHolePasteFixture = () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} routingDisabled>
      <platedhole
        name="through_hole"
        shape="circle"
        outerDiameter={2}
        holeDiameter={1}
        pcbX={-4}
      />
      <chip
        name="U1"
        pcbX={4}
        footprint={
          <footprint>
            <smtpad shape="rect" width={2} height={2} />
          </footprint>
        }
      />
      <pcbnotetext
        text="THT: no paste requested"
        pcbX={-4}
        pcbY={3}
        fontSize={0.35}
      />
      <pcbnotetext text="SMT control" pcbX={4} pcbY={3} fontSize={0.35} />
    </board>,
  )
  circuit.render()
  return circuit
}
