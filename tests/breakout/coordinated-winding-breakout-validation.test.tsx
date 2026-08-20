import { expect, test } from "bun:test"
import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"
import { AutoplacedBreakoutPoint } from "lib/components/primitive-components/AutoplacedBreakoutPoint"
import type { Breakout } from "lib/components/primitive-components/Breakout/Breakout"
import { createCoordinatedWindingBreakoutInput } from "lib/components/primitive-components/Breakout/create-coordinated-winding-breakout-input"
import { Fragment, type ReactNode } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type ValidationVariant = "layers" | "conflict" | "differential_mismatch"

const CoordinatedValidationBoard = ({
  variant,
  addMissingEndpoint = false,
}: {
  variant: ValidationVariant
  addMissingEndpoint?: boolean
}) => {
  let busElements: ReactNode
  if (variant === "layers") {
    busElements = (
      <>
        <bus
          name="EXPLICIT"
          connections={["D0", "D1"]}
          preferredLayer="inner1"
          preferredLayers={["bottom"]}
        />
        <bus name="DEFAULTED" connections={["D2", "D3"]} />
      </>
    )
  } else if (variant === "conflict") {
    busElements = (
      <>
        <bus name="FIRST" connections={["D0", "D1"]} preferredLayer="inner1" />
        <bus
          name="SECOND"
          connections={["D0", "D1"]}
          preferredLayers={["inner2"]}
        />
      </>
    )
  } else {
    busElements = (
      <>
        <bus
          name="POSITIVE_LAYER"
          connections={["D0", "D2"]}
          preferredLayer="inner1"
        />
        <bus
          name="NEGATIVE_LAYER"
          connections={["D1", "D3"]}
          preferredLayers={["inner2"]}
        />
        <differentialpair
          name="DATA_PAIR"
          positiveConnection="D0"
          negativeConnection="D1"
        />
      </>
    )
  }

  return (
    <board width="30mm" height="15mm" routingDisabled>
      <breakout name="LEFT" pcbX={-6} padding="1.5mm">
        <chip name="U1" footprint="soic8" noSchematicRepresentation />
      </breakout>
      <breakout name="RIGHT" pcbX={6} padding="1.5mm">
        <chip name="U2" footprint="soic8" noSchematicRepresentation />
      </breakout>
      {busElements}
      {[0, 1, 2, 3, 4].map((pinOffset) => (
        <Fragment key={`D${pinOffset}`}>
          <trace
            name={`D${pinOffset}`}
            from={`U1.pin${pinOffset + 1}`}
            to={`U2.pin${pinOffset + 1}`}
          />
        </Fragment>
      ))}
      {addMissingEndpoint && (
        <>
          <resistor name="R1" resistance="1k" footprint="0402" pcbY={6} />
          <trace name="LEFT_ONLY" from="U1.pin6" to="R1.pin1" />
        </>
      )}
    </board>
  )
}

const getSelectedLayerByConnectionName = (
  input: ReturnType<typeof createCoordinatedWindingBreakoutInput>,
): Map<string, string> => {
  const sourceTraceNameById = new Map(
    input.routingScope
      .root!.db.source_trace.list()
      .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace.name]),
  )
  const solver = new WindingBreakoutSolver(input.solverInput)
  solver.solve()
  return new Map(
    Object.entries(solver.getOutput().layerByConnection).map(
      ([connectionId, layer]) => [
        sourceTraceNameById.get(connectionId)!,
        layer,
      ],
    ),
  )
}

test("validates coordinated winding layers and endpoints", async () => {
  const validFixture = getTestFixture()
  validFixture.circuit.add(<CoordinatedValidationBoard variant="layers" />)
  await validFixture.circuit.renderUntilSettled()
  const leftBreakout = validFixture.circuit.selectOne(".LEFT") as Breakout
  const validInput = createCoordinatedWindingBreakoutInput(leftBreakout)
  expect(validInput.solverInput.buses).toEqual([
    {
      id: "EXPLICIT",
      connectionIds: expect.any(Array),
      preferredLayer: "inner1",
      preferredLayers: ["bottom"],
    },
    {
      id: "DEFAULTED",
      connectionIds: expect.any(Array),
    },
  ])
  expect(getSelectedLayerByConnectionName(validInput)).toEqual(
    new Map([
      ["D0", "inner1"],
      ["D1", "inner1"],
      ["D2", "top"],
      ["D3", "top"],
      ["D4", "top"],
    ]),
  )

  const originalBreakoutPoint = leftBreakout.children.find(
    (child) => child instanceof AutoplacedBreakoutPoint,
  ) as AutoplacedBreakoutPoint
  const duplicateBreakoutPoint = new AutoplacedBreakoutPoint({})
  duplicateBreakoutPoint.matchedPort = originalBreakoutPoint.matchedPort
  duplicateBreakoutPoint.matchedSourceTraceId =
    originalBreakoutPoint.matchedSourceTraceId
  leftBreakout.add(duplicateBreakoutPoint)
  expect(() => createCoordinatedWindingBreakoutInput(leftBreakout)).toThrow(
    /duplicate endpoint/,
  )

  const missingFixture = getTestFixture()
  missingFixture.circuit.add(
    <CoordinatedValidationBoard variant="layers" addMissingEndpoint />,
  )
  await expect(missingFixture.circuit.renderUntilSettled()).rejects.toThrow(
    /missing endpoint/,
  )

  const conflictFixture = getTestFixture()
  conflictFixture.circuit.add(<CoordinatedValidationBoard variant="conflict" />)
  await expect(conflictFixture.circuit.renderUntilSettled()).rejects.toThrow(
    /belongs to multiple buses/,
  )

  const pairMismatchFixture = getTestFixture()
  pairMismatchFixture.circuit.add(
    <CoordinatedValidationBoard variant="differential_mismatch" />,
  )
  await expect(
    pairMismatchFixture.circuit.renderUntilSettled(),
  ).rejects.toThrow(/differential pair.*same bus/i)
})
