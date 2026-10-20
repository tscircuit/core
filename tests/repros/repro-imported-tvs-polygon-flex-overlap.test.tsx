import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// ESD5Z5.0T1G (C82044) pad geometry from the imported ble-pedometer part
// used by Done Dot: https://tscircuit.com/AnasSarkiz/ble-pedometer
// Coordinates are footprint-local, mm, +X right/+Y up.
// The two rows have identical physical copper; only the pad representation differs.
function ImportedTvs({
  name,
  rectangular = false,
}: { name: string; rectangular?: boolean }) {
  return (
    <chip
      name={name}
      manufacturerPartNumber="ESD5Z5.0T1G"
      pinLabels={{ pin1: ["C"], pin2: ["A"] }}
      footprint={
        <footprint>
          {rectangular ? (
            <>
              <smtpad
                portHints={["pin1"]}
                shape="rect"
                pcbX={-0.7112}
                pcbY={0.0050038}
                width={0.6096}
                height={0.4826}
              />
              <smtpad
                portHints={["pin2"]}
                shape="rect"
                pcbX={0.7112}
                pcbY={-0.0050038}
                width={0.6096}
                height={0.4826}
              />
            </>
          ) : (
            <>
              <smtpad
                portHints={["pin1"]}
                shape="polygon"
                points={[
                  { x: -1.016, y: 0.2463038 },
                  { x: -0.4064, y: 0.2463038 },
                  { x: -0.4064, y: -0.2362962 },
                  { x: -1.016, y: -0.2362962 },
                ]}
              />
              <smtpad
                portHints={["pin2"]}
                shape="polygon"
                points={[
                  { x: 0.4064, y: 0.2362962 },
                  { x: 1.016, y: 0.2362962 },
                  { x: 1.016, y: -0.2463038 },
                  { x: 0.4064, y: -0.2463038 },
                ]}
              />
            </>
          )}
          <silkscreenpath
            route={[
              { x: -0.66, y: 0.432 },
              { x: 0.66, y: 0.432 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.66, y: -0.432 },
              { x: 0.66, y: -0.432 },
            ]}
          />
          <silkscreentext text={name} pcbY={1.1} fontSize={0.5} />
        </footprint>
      }
    />
  )
}

test("imported TVS polygon pads preserve the same flex gap as equivalent rectangles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={11} routingDisabled>
      <group
        name="POLYGON"
        pcbY={2}
        pcbFlex
        pcbFlexGap={0.8}
        pcbFlexDirection="row"
      >
        <ImportedTvs name="D1" />
        <ImportedTvs name="D2" />
      </group>
      <group
        name="RECTANGULAR"
        pcbY={-2}
        pcbFlex
        pcbFlexGap={0.8}
        pcbFlexDirection="row"
      >
        <ImportedTvs name="D3" rectangular />
        <ImportedTvs name="D4" rectangular />
      </group>
      <pcbnotetext text="POLYGON PADS: 0.8mm GAP" pcbY={4.5} fontSize={0.45} />
      <pcbnotetext
        text="SAME COPPER AS RECTANGLES: 0.8mm GAP"
        pcbY={-4}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const polygonPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "polygon")
  const rectangularPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "rect")
  expect(polygonPads).toHaveLength(4)
  for (const [padIndex, polygonPad] of polygonPads.entries()) {
    const rectangularPad = rectangularPads[padIndex]!
    expect(Math.min(...polygonPad.points.map((point) => point.x))).toBeCloseTo(
      rectangularPad.x - rectangularPad.width / 2,
    )
    expect(Math.max(...polygonPad.points.map((point) => point.x))).toBeCloseTo(
      rectangularPad.x + rectangularPad.width / 2,
    )
  }
  const innerCopperGap =
    Math.min(...polygonPads[2]!.points.map((point) => point.x)) -
    Math.max(...polygonPads[1]!.points.map((point) => point.x))
  expect(innerCopperGap).toBeCloseTo(0.8)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
