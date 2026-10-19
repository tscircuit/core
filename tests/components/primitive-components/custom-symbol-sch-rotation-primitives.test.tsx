import { expect, test } from "bun:test"
import type { SymbolProps } from "@tscircuit/props"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schRotation rotates resized custom symbol primitives", () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const symbolProps: SymbolProps = {
    width: 4,
    height: 2,
    viewbox: { minX: -1, maxX: 1, minY: -0.5, maxY: 0.5 },
  }
  circuit.add(
    <board>
      {[0, 90, 180, 270].map((rotation, column) => (
        <Fragment key={rotation}>
          <chip
            name={`U${column + 1}`}
            schX={2 + column * 5}
            schY={3}
            schRotation={rotation}
            symbol={
              <symbol {...symbolProps}>
                <schematicrect width={1} height={0.6} strokeWidth={0.03} />
                <schematicline
                  x1={0}
                  y1={0}
                  x2={0.4}
                  y2={0.1}
                  strokeWidth={0.03}
                />
                <schematiccircle
                  center={{ x: -0.3, y: 0.1 }}
                  radius={0.1}
                  strokeWidth={0.03}
                />
                <schematicarc
                  center={{ x: 0.25, y: -0.1 }}
                  radius={0.12}
                  startAngleDegrees={10}
                  endAngleDegrees={130}
                  strokeWidth={0.03}
                />
                <schematictext
                  text="A"
                  schX={-0.1}
                  schY={0.15}
                  schRotation={30}
                  fontSize={0.15}
                />
              </symbol>
            }
          />
          <schematictext
            text={`2x size, ${rotation} deg`}
            schX={2 + column * 5}
            schY={1.2}
            fontSize={0.2}
          />
        </Fragment>
      ))}
    </board>,
  )
  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
