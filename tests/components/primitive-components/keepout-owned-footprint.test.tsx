import {
  checkPcbCopperOverKeepout,
  checkPcbCourtyardOverKeepout,
} from "@tscircuit/checks"
import { expect, spyOn, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points in right-handed mm, +X right/+Y top/+Z above.
// The own land touches the hard keepout at X=1; its courtyard spans it.
const importedFootprint: AnyCircuitElement[] = [
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "",
    pcb_component_id: "",
    pcb_port_id: "",
    shape: "rect",
    x: 0.5,
    y: 0,
    width: 1,
    height: 1,
    layer: "top",
    port_hints: ["1"],
  },
  {
    type: "pcb_courtyard_rect",
    pcb_courtyard_rect_id: "",
    pcb_component_id: "",
    center: { x: 0, y: 0 },
    width: 6,
    height: 4,
    layer: "top",
  },
  {
    type: "pcb_keepout",
    pcb_keepout_id: "",
    shape: "rect",
    center: { x: 2, y: 0 },
    width: 2,
    height: 2,
    layers: ["top"],
    allow_traces: false,
    allow_placements: false,
    warning_only: false,
  },
]

test("footprint keepouts exempt their own lands and courtyard while foreign copper stays forbidden", async () => {
  const { circuit } = getTestFixture()
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async () => {
    throw new Error("Owned keepout rendering must not request external assets")
  })
  try {
    circuit.add(
      <board width={26} height={12} schematicDisabled autorouter="none">
        <chip
          cadModel={null}
          name="IMPORTED"
          pcbX={-7}
          pinLabels={{ pin1: "SHELL" }}
          footprint={importedFootprint}
        />
        <chip
          cadModel={null}
          name="JSX"
          pcbX={6}
          pinLabels={{ pin1: "SHELL" }}
          footprint={
            <footprint>
              <smtpad
                pcbX={0.5}
                shape="rect"
                width={1}
                height={1}
                portHints={["1"]}
              />
              <courtyardrect width={6} height={4} />
              <keepout
                pcbX={2}
                shape="circle"
                radius={1}
                allowTraces={false}
                allowPlacements={false}
                warningOnly={false}
                excludeRefs={[".EXEMPT"]}
              />
            </footprint>
          }
        />
        {[-5, 8].map((pcbX, column) => (
          <chip
            cadModel={null}
            key={pcbX}
            name={`FOREIGN_SMT${column}`}
            pcbX={pcbX}
            pcbY={0.45}
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <smtpad
                  shape="rect"
                  width={0.3}
                  height={0.3}
                  portHints={["1"]}
                />
                <courtyardrect width={0.5} height={0.5} />
              </footprint>
            }
          />
        ))}
        {[-5, 8].map((pcbX, column) => (
          <chip
            cadModel={null}
            key={pcbX}
            name={`FOREIGN_PTH${column}`}
            pcbX={pcbX}
            pcbY={-0.45}
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <platedhole
                  shape="circle"
                  holeDiameter={0.15}
                  outerDiameter={0.3}
                  portHints={["1"]}
                />
                <courtyardrect width={0.5} height={0.5} />
              </footprint>
            }
          />
        ))}
        <chip
          cadModel={null}
          name="EXEMPT"
          pcbX={8}
          pinLabels={{ pin1: "ALLOWED" }}
          footprint={
            <footprint>
              <smtpad shape="circle" radius={0.1} portHints={["1"]} />
            </footprint>
          }
        />
        <pcbnotetext
          pcbX={-7}
          pcbY={-4}
          fontSize={0.55}
          text="Imported: own shell edge/courtyard exempt"
        />
        <pcbnotetext
          pcbX={6}
          pcbY={-4}
          fontSize={0.55}
          text="JSX: owner + explicit EXEMPT"
        />
        <pcbnotetext
          pcbY={4}
          fontSize={0.55}
          text="Foreign SMT + PTH forbidden in both hard keepouts"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const pcbComponentFor = (name: string) => {
      const source = circuit.db.source_component.getWhere({ name })!
      return circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
    }
    const [rectangle, circle] = circuit.db.pcb_keepout.list()
    expect(rectangle!.excluded_pcb_component_ids).toEqual([
      pcbComponentFor("IMPORTED").pcb_component_id,
    ])
    expect(circle!.excluded_pcb_component_ids).toEqual([
      pcbComponentFor("EXEMPT").pcb_component_id,
      pcbComponentFor("JSX").pcb_component_id,
    ])
    for (const keepout of [rectangle, circle]) {
      expect(keepout).toMatchObject({
        allow_traces: false,
        allow_placements: false,
        warning_only: false,
      })
    }
    const soup = circuit.getCircuitJson()
    // Removing only the automatic owners reproduces both own edge-contact
    // and own-courtyard diagnostics; the explicit EXEMPT stays excluded.
    const ownerIds = [
      pcbComponentFor("IMPORTED").pcb_component_id,
      pcbComponentFor("JSX").pcb_component_id,
    ]
    const withoutOwnerExclusions = soup.map((element) =>
      element.type === "pcb_keepout"
        ? {
            ...element,
            excluded_pcb_component_ids:
              element.excluded_pcb_component_ids?.filter(
                (id) => !ownerIds.includes(id),
              ),
          }
        : element,
    )
    expect(checkPcbCopperOverKeepout(withoutOwnerExclusions)).toHaveLength(6)
    expect(checkPcbCourtyardOverKeepout(withoutOwnerExclusions)).toHaveLength(6)
    const copperErrors = checkPcbCopperOverKeepout(soup)
    const courtyardErrors = checkPcbCourtyardOverKeepout(soup)
    for (const findings of [copperErrors, courtyardErrors]) {
      expect(findings).toHaveLength(4)
      expect(
        findings.every((finding) => finding.type === "pcb_placement_error"),
      ).toBe(true)
      expect(
        findings.every((finding) => finding.message.includes("FOREIGN_")),
      ).toBe(true)
    }
    const obstacles = getObstaclesFromCircuitJson([rectangle!, circle!])
    expect(obstacles).toHaveLength(2)
    expect(
      obstacles.every((obstacle) => obstacle.connectedTo.length === 0),
    ).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      showCourtyards: true,
    })
  } finally {
    fetchSpy.mockRestore()
  }
})
