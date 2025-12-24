import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro76-silkscreen-rect-rotation - silkscreen rect should rotate with chip", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      {/* Chip at 0 degrees - baseline */}
      <chip
        name="U1"
        pcbX={-15}
        pcbY={15}
        pcbRotation={0}
        footprint={
          <footprint>
            <smtpad shape="circle" pcbX={-1} pcbY={1} radius={0.5} />
            <smtpad shape="rect" pcbX={1} pcbY={1} width={1} height={0.8} />
            <silkscreenrect pcbX={0} pcbY={-1} width={2} height={1.5} />
            <silkscreentext pcbX={0} pcbY={-2.5} text="0°" fontSize={0.8} />
          </footprint>
        }
      />

      {/* Chip at 90 degrees */}
      <chip
        name="U2"
        pcbX={15}
        pcbY={15}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad shape="circle" pcbX={-1} pcbY={1} radius={0.5} />
            <smtpad shape="rect" pcbX={1} pcbY={1} width={1} height={0.8} />
            <silkscreenrect pcbX={0} pcbY={-1} width={2} height={1.5} />
            <silkscreentext pcbX={0} pcbY={-2.5} text="90°" fontSize={0.8} />
          </footprint>
        }
      />

      {/* Chip at 180 degrees */}
      <chip
        name="U3"
        pcbX={-15}
        pcbY={-15}
        pcbRotation={180}
        footprint={
          <footprint>
            <smtpad shape="circle" pcbX={-1} pcbY={1} radius={0.5} />
            <smtpad shape="rect" pcbX={1} pcbY={1} width={1} height={0.8} />
            <silkscreenrect pcbX={0} pcbY={-1} width={2} height={1.5} />
            <silkscreentext pcbX={0} pcbY={-2.5} text="180°" fontSize={0.8} />
          </footprint>
        }
      />

      {/* Chip at 270 degrees */}
      <chip
        name="U4"
        pcbX={15}
        pcbY={-15}
        pcbRotation={270}
        footprint={
          <footprint>
            <smtpad shape="circle" pcbX={-1} pcbY={1} radius={0.5} />
            <smtpad shape="rect" pcbX={1} pcbY={1} width={1} height={0.8} />
            <silkscreenrect pcbX={0} pcbY={-1} width={2} height={1.5} />
            <silkscreentext pcbX={0} pcbY={-2.5} text="270°" fontSize={0.8} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
