import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SwitchShaft = (props: { name: string; pcbX?: number; pcbY?: number }) => (
  <chip
    {...props}
    footprint={
      <footprint>
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin1"]}
        />
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin2"]}
        />
        <platedhole
          shape="circle"
          name="H1"
          holeDiameter="3mm"
          outerDiameter="3.1mm"
        />
        <platedhole
          shape="circle"
          name="H2"
          holeDiameter="3mm"
          outerDiameter="3.1mm"
        />
        <constraint xDist="6.35mm" centerToCenter left=".H1" right=".H2" />
        <constraint yDist="2.54mm" centerToCenter top=".H1" bottom=".H2" />
        <constraint edgeToEdge xDist="11.3mm" left=".pin1" right=".pin2" />
        <constraint sameY for={[".pin1", ".H1"]} />
        <constraint sameY for={[".pin2", ".H2"]} />
        <constraint
          edgeToEdge
          xDist={(11.3 - 6.35 - 3) / 2}
          left=".pin1"
          right=".H1"
        />
      </footprint>
    }
  />
)

test("example2-switchshaft", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <SwitchShaft name="S1" pcbX={0} pcbY={0} />
      <SwitchShaft name="S2" pcbX={0} pcbY={-10} />
    </board>,
  )

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
