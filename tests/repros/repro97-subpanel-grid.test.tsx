import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Simple board with corner holes and a center note
const SmallBoard = ({ label }: { label: string }) => (
  <board width={10} height={10}>
    <platedhole
      name="H1"
      pcbX={-3}
      pcbY={-3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <platedhole
      name="H2"
      pcbX={3}
      pcbY={-3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <platedhole
      name="H3"
      pcbX={3}
      pcbY={3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <platedhole
      name="H4"
      pcbX={-3}
      pcbY={3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <pcbnotetext pcbX={0} pcbY={0} text={label} fontSize={2} />
  </board>
)

// Wider board variant
const WideBoard = ({ label }: { label: string }) => (
  <board width={20} height={10}>
    <platedhole
      name="H1"
      pcbX={-8}
      pcbY={-3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <platedhole
      name="H2"
      pcbX={8}
      pcbY={-3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <platedhole
      name="H3"
      pcbX={8}
      pcbY={3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <platedhole
      name="H4"
      pcbX={-8}
      pcbY={3}
      holeDiameter={1}
      outerDiameter={1.5}
      shape="circle"
    />
    <pcbnotetext pcbX={0} pcbY={0} text={label} fontSize={2} />
  </board>
)

test("subpanels in grid layout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width={80} height={60} layoutMode="grid">
      <subpanel>
        <SmallBoard label="A1" />
      </subpanel>
      <subpanel>
        <SmallBoard label="A2" />
      </subpanel>
      <subpanel>
        <WideBoard label="B1" />
      </subpanel>
      <subpanel>
        <SmallBoard label="A3" />
      </subpanel>
      <subpanel>
        <WideBoard label="B2" />
      </subpanel>
      <subpanel>
        <SmallBoard label="A4" />
      </subpanel>
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
