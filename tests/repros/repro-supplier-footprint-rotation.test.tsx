import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { Board } from "lib/components/normal-components/Board/Board"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: matching supplier footprints falsely warn at oblique rotations on both layers", async () => {
  const { circuit: supplierCircuit } = getTestFixture()
  supplierCircuit.add(
    <board width={8} height={6} routingDisabled>
      <capacitor name="C_SUPPLIER" capacitance="100nF" footprint="0603" />
    </board>,
  )
  await supplierCircuit.renderUntilSettled()

  const partsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C14663"] }),
    fetchPartCircuitJson: async () => supplierCircuit.getCircuitJson(),
  }
  const ccwRotationsDegrees = [0, 30, -30, 45, 90, 120, 180, 270]
  const rows = [
    { layer: "top", pcbY: 5 },
    { layer: "bottom", pcbY: -5 },
  ] as const
  const placements = rows.flatMap(({ layer, pcbY }, rowIndex) =>
    ccwRotationsDegrees.map((ccwRotationDegrees, columnIndex) => ({
      name: `C${rowIndex * ccwRotationsDegrees.length + columnIndex + 1}`,
      layer,
      pcbX: (columnIndex - (ccwRotationsDegrees.length - 1) / 2) * 10,
      pcbY,
      ccwRotationDegrees,
    })),
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={86} height={30} routingDisabled partsEngine={partsEngine}>
      <pcbnotetext text="SUPPLIER FOOTPRINT: 0603" pcbY={13} fontSize={1} />
      <pcbnotetext
        text="Identical 0603 footprints: expect no warnings at any rotation"
        pcbY={11}
        fontSize={0.65}
      />
      {rows.map(({ layer, pcbY }) => (
        <Fragment key={layer}>
          <pcbnotetext
            text={`${layer.toUpperCase()} / MATCHING 0603`}
            pcbY={pcbY + 3.5}
            fontSize={0.8}
          />
        </Fragment>
      ))}
      {placements.map(({ name, layer, pcbX, pcbY, ccwRotationDegrees }) => (
        <Fragment key={name}>
          <capacitor
            name={name}
            capacitance="100nF"
            footprint="0603"
            layer={layer}
            pcbX={pcbX}
            pcbY={pcbY}
            pcbRotation={ccwRotationDegrees}
            supplierPartNumbers={{ jlcpcb: ["C14663"] }}
          />
          <pcbnotetext
            text={`${ccwRotationDegrees} deg`}
            pcbX={pcbX}
            pcbY={pcbY + 2}
            fontSize={0.6}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const board = circuit.firstChild
  if (!(board instanceof Board))
    throw new Error("Expected the comparison board")
  for (const { name, layer, pcbX, pcbY, ccwRotationDegrees } of placements) {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((sourceComponent) => sourceComponent.name === name)!
    const warnings = circuit.db.supplier_footprint_mismatch_warning.list({
      source_component_id: sourceComponent.source_component_id,
    })
    expect(
      warnings,
      `${name}: ${layer} at ${ccwRotationDegrees} deg`,
    ).toHaveLength(ccwRotationDegrees % 90 !== 0 ? 1 : 0)
    board.add(
      <pcbnotetext
        text={warnings.length ? "WARNING" : "NO WARNING"}
        pcbX={pcbX}
        pcbY={pcbY - 2.5}
        fontSize={0.65}
      />,
    )
  }
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawWarnings: true,
    showCourtyards: false,
    width: 1500,
    height: 600,
  })
})
