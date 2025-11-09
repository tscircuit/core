import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Via = (props: { pcbX: number | string; pcbY: number | string }) => (
  <via
    netIsAssignable
    pcbX={props.pcbX}
    pcbY={props.pcbY}
    fromLayer={"top"}
    toLayer={"bottom"}
    holeDiameter={"0.2mm"}
    outerDiameter={"0.4mm"}
  />
)

const range = (start: number, end: number, inc = 1) => {
  return Array.from({ length: (end - start) / inc }, (_, i) => start + i * inc)
}

const ViaZone = (props: {
  minX: number
  maxX: number
  minY: number
  maxY: number
  spacing: number
}) => {
  const xRange = range(props.minX, props.maxX, props.spacing)
  const yRange = range(props.minY, props.maxY, props.spacing)
  const centeringOffsetX =
    (props.maxX - props.minX - (xRange.length - 1) * props.spacing) / 2
  const centeringOffsetY =
    (props.maxY - props.minY - (yRange.length - 1) * props.spacing) / 2

  return (
    <>
      <pcbnoterect
        color="blue"
        width={props.maxX - props.minX}
        height={props.maxY - props.minY}
        pcbPositionAnchor="center"
        pcbX={props.minX + (props.maxX - props.minX) / 2}
        pcbY={props.minY + (props.maxY - props.minY) / 2}
      />
      {xRange.flatMap((x) =>
        yRange.map((y) => (
          <Via
            key={`${x},${y}`}
            pcbX={x + centeringOffsetX}
            pcbY={y + centeringOffsetY}
          />
        )),
      )}
    </>
  )
}

const boardWidthMm = 75
const boardHeightMm = 55

test(
  "board copper pours can opt in to solder mask coverage",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        width={`${boardWidthMm}mm`}
        height={`${boardHeightMm}mm`}
        borderRadius="2mm"
      >
        <silkscreentext
          text="UP"
          pcbX={boardWidthMm / 2 - 10}
          pcbY={25.5}
          layer="top"
          fontSize="2mm"
        />
        <hole
          pcbX={boardWidthMm / 2 - 2.5}
          pcbY={boardHeightMm / 2 - 2.5}
          diameter="2.2mm"
        />
        <hole
          pcbX={boardWidthMm / 2 - 2.5 - 4}
          pcbY={boardHeightMm / 2 - 2.5}
          diameter="2.2mm"
        />
        <hole
          pcbX={boardWidthMm / 2 - 2.5}
          pcbY={-boardHeightMm / 2 + 2.5}
          diameter="2.2mm"
        />
        <hole
          pcbX={-boardWidthMm / 2 + 2.5}
          pcbY={-boardHeightMm / 2 + 2.5}
          diameter="2.2mm"
        />
        <hole
          pcbX={-boardWidthMm / 2 + 2.5}
          pcbY={boardHeightMm / 2 - 2.5}
          diameter="2.2mm"
        />
        <net name="GND" />
        <copperpour
          connectsTo="net.GND"
          layer="top"
          coveredWithSolderMask
          name="PourTop"
        />
        <copperpour
          connectsTo="net.GND"
          layer="bottom"
          coveredWithSolderMask
          name="PourBottom"
        />
        <pcbnotedimension
          from={{ x: -boardWidthMm / 2, y: boardHeightMm / 2 + 2.5 }}
          to={{ x: boardWidthMm / 2, y: boardHeightMm / 2 + 2.5 }}
          text={`${boardWidthMm}mm`}
        />
        <pcbnotedimension
          from={{ x: boardWidthMm / 2 + 2.5, y: -boardHeightMm / 2 }}
          to={{ x: boardWidthMm / 2 + 2.5, y: boardHeightMm / 2 }}
          text={`${boardHeightMm}mm`}
        />
        <ViaZone
          minX={-boardWidthMm / 2 + 2}
          maxX={-boardWidthMm / 2 + 10}
          minY={-boardHeightMm / 2 + 2}
          maxY={-boardHeightMm / 2 + 10}
          spacing={2}
        />
        <ViaZone
          minX={-boardWidthMm / 2 + 2}
          maxX={-boardWidthMm / 2 + 10}
          minY={boardHeightMm / 2 - 10}
          maxY={boardHeightMm / 2 - 2}
          spacing={2}
        />
        <ViaZone
          minX={10}
          maxX={boardWidthMm / 2 - 10}
          minY={boardHeightMm / 2 - 10}
          maxY={boardHeightMm / 2 - 2}
          spacing={3}
        />
        <ViaZone
          minX={boardWidthMm / 2 - 5 - 2}
          maxX={boardWidthMm / 2 - 5 + 2}
          minY={-boardHeightMm / 2 + 5}
          maxY={boardHeightMm / 2 - 5}
          spacing={2}
        />
        <ViaZone minX={-20} maxX={0} minY={-8} maxY={8} spacing={4} />
      </board>,
    )

    await circuit.renderUntilSettled()

    const copperPours = circuit.db.pcb_copper_pour.list()
    expect(copperPours.length).toBeGreaterThan(0)
    expect(
      copperPours.every((pour) => pour.covered_with_solder_mask === true),
    ).toBe(true)
  },
  { timeout: 30_000 },
)
