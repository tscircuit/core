import { expect } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import type { PcbSuboptimalOrientationWarningEvent } from "lib/events"
import { getSuboptimalChipOrientationsSrj } from "lib/utils/autorouting/get-suboptimal-chip-orientations-srj"
import { getTestFixture } from "./get-test-fixture"

export async function checkChipOrientationAirwires(
  rotation: number,
  testPath: string,
) {
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    const warnings: PcbSuboptimalOrientationWarningEvent[] = []
    let preRoutingJson: AnyCircuitElement[] = []
    let analysis:
      | ReturnType<typeof getSuboptimalChipOrientationsSrj>[number]
      | undefined
    circuit.on("pcb:suboptimal_orientation_warning", (warning) =>
      warnings.push(warning),
    )
    circuit.on("autorouting:start", (event) => {
      analysis = getSuboptimalChipOrientationsSrj({
        db: circuit.db,
        simpleRouteJson: event.simpleRouteJson,
      }).find((a) => a.chipName === "U1")
      preRoutingJson = structuredClone(circuit.getCircuitJson())
    })
    circuit.on("solver:started", (event) => {
      if (event.solverName === "BusLanesPipelineSolver") {
        expect(analysis).toBeDefined()
        expect(warnings.length).toBe(analysis!.shouldWarn ? 1 : 0)
      }
    })
    circuit.add(
      <board width={22} height={16} autorouter="bus_lanes">
        <chip
          name="U1"
          pcbX={-4}
          pcbY={0}
          pcbRotation={rotation}
          layer={layer}
          pinLabels={{ pin1: "D0", pin2: "D1", pin3: "D2", pin4: "D3" }}
          footprint={
            <footprint>
              {[-3, -1, 1, 3].map((y, i) => (
                <smtpad
                  portHints={[`pin${i + 1}`]}
                  pcbX={2}
                  pcbY={y}
                  width={0.8}
                  height={0.8}
                  shape="rect"
                />
              ))}
              {[-3, -1, 1, 3].map((y, i) => (
                <smtpad
                  portHints={[`pin${i + 5}`]}
                  pcbX={-2}
                  pcbY={y}
                  width={0.8}
                  height={0.8}
                  shape="rect"
                />
              ))}
            </footprint>
          }
        />
        {[-3, -1, 1, 3].map((y, i) => (
          <resistor
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0402"
            pcbX={7}
            pcbY={y}
            layer={layer}
          />
        ))}
        {[1, 2, 3, 4].map((pin) => (
          <trace
            name={`D${pin - 1}`}
            from={`.U1 > .pin${pin}`}
            to={`.R${pin} > .pin1`}
          />
        ))}
        <pcbnotetext
          pcbX={0}
          pcbY={6}
          fontSize={0.65}
          text="Orientation result"
        />
        <pcbnotetext
          pcbX={0}
          pcbY={5}
          fontSize={0.4}
          text="Rotate U1 only; targets stay fixed. Dashed lines are airwires."
        />
        <pcbnotetext
          pcbX={0}
          pcbY={-6}
          fontSize={0.4}
          text="Warn if at least 2 crossings removed AND at least 25% fewer."
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(analysis).toBeDefined()
    // Pin these against the four independently emitted placements, rather than
    // recomputing the same rotation expression in the assertion.
    const emittedCrossings = layer === "top" ? [0, 3, 6, 3] : [0, 0, 6, 0]
    expect(analysis!.orientations).toEqual(
      [0, 90, 180, 270].map((delta) => {
        const candidateRotation = (rotation + delta) % 360
        return {
          rotation: candidateRotation,
          crossings: emittedCrossings[candidateRotation / 90],
        }
      }),
    )
    expect(warnings).toHaveLength(analysis!.shouldWarn ? 1 : 0)
    const note = preRoutingJson.find(
      (e) => e.type === "pcb_note_text" && e.text === "Orientation result",
    )
    if (note?.type === "pcb_note_text")
      note.text = `${rotation} deg (${layer}): ${analysis!.currentCrossings} crossings - ${analysis!.shouldWarn ? "WARNING" : "no warning"}; best ${analysis!.recommendedRotation} deg: ${analysis!.bestCrossings}`
    await expect(preRoutingJson).toMatchPcbSnapshot(
      layer === "top"
        ? testPath
        : testPath.replace(".test.tsx", "-bottom.test.tsx"),
      { shouldDrawRatsNest: true, layer, showPinNumbers: true },
    )
  }
}
