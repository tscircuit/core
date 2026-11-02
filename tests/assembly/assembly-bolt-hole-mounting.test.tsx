import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { loadMechanicalModel } from "./fixtures/mechanical-assembly-models"
import { withLocalBoltMesh } from "./fixtures/with-local-bolt-mesh"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("bolts fasten to finalized PCB holes, plated holes and their bottom faces", async () => {
  const { circuit } = getTestFixture()
  const driver = await loadMechanicalModel("soic8_driver")
  circuit.add(
    <assembly.device>
      <assembly.bolt name="B1" model="m3bolt" fastenedTo=".CONTROL > .H1" />
      <assembly.bolt name="B2" model="bolt_m3" fastenedTo="CONTROL.H2" />
      <assembly.bolt
        name="B3"
        model="m3bolt"
        fastenedTo=".CONTROL > .H3 > .bottom"
      />
      <assembly.bolt
        name="B4"
        model="bolt_m3"
        fastenedTo=".CONTROL > .H4"
        mountGap={2}
      />
      <board
        name="CONTROL"
        width={64}
        height={64}
        thickness={1.6}
        pcbX={12}
        pcbY={8}
        pcbRotation={30}
        routingDisabled
      >
        <hole name="H1" diameter={3.2} pcbX={-20} pcbY={-20} />
        <hole name="H2" diameter={3.2} pcbX={20} pcbY={-20} />
        <hole name="H3" diameter={3.2} pcbX={-20} pcbY={20} />
        <platedhole
          name="H4"
          shape="circle"
          holeDiameter={3.2}
          outerDiameter={6}
          pcbX={20}
          pcbY={20}
        />
        <chip
          name="U_DRIVER"
          footprint="soic8"
          cadModel={{ ...driver, modelBoardNormalDirection: "z+" }}
        />
      </board>
      <assembly.printedpart
        name="SUPPORT"
        jscad={
          <jscad.translate offset={[12, 8, 0]}>
            <jscad.rotate angles={[0, 0, Math.PI / 6]}>
              <jscad.colorize color="#2879b7">
                <jscad.subtract>
                  <jscad.union>
                    <jscad.cuboid size={[60, 60, 3]} center={[0, 0, -10.3]} />
                    {[-20, 20].map((x) => (
                      <jscad.cylinder
                        key={x}
                        radius={4}
                        height={8}
                        center={[x, -20, -4.8]}
                      />
                    ))}
                  </jscad.union>
                  {[-20, 20].map((x) => (
                    <jscad.cylinder
                      key={x}
                      radius={1.4}
                      height={14}
                      center={[x, -20, -5]}
                    />
                  ))}
                  <jscad.cuboid size={[44, 20, 6]} center={[0, 16, -10.3]} />
                </jscad.subtract>
              </jscad.colorize>
            </jscad.rotate>
          </jscad.translate>
        }
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cad = (name: string) =>
    circuit.db.cad_component
      .list()
      .find(
        (cad) =>
          circuit.db.source_component.get(cad.source_component_id!)?.name ===
          name,
      )!
  const holes = [
    ...circuit.db.pcb_hole.list(),
    ...circuit.db.pcb_plated_hole.list(),
  ]
  const pcb = circuit.db.pcb_board.list()[0]!
  for (const [i, name] of ["B1", "B2", "B3", "B4"].entries()) {
    const bolt = cad(name),
      hole = holes[i]!
    expect(bolt.position.x).toBeCloseTo(hole.x, 5)
    expect(bolt.position.y).toBeCloseTo(hole.y, 5)
    expect(bolt.position.z).toBeCloseTo(i === 2 ? -0.8 : i === 3 ? 2.8 : 0.8, 5)
    expect(bolt.subcircuit_id).toBe(pcb.subcircuit_id)
    expect(bolt.model_glb_url).toBe(
      "https://modelcdn.tscircuit.com/jscad_models/hexsocketbolt_m3_l10mm.glb",
    )
  }
  // Board rotation/translation must change the authored hole coordinates.
  expect(cad("B1").position.x).not.toBeCloseTo(-20)
  const json = await withLocalBoltMesh(circuit.getCircuitJson())
  for (const name of ["B1", "B3"]) {
    const bolt = cad(name)
    const bounds = await getRenderedMotorBounds(
      json.filter(
        (element) =>
          element.type === "cad_component" &&
          element.source_component_id === bolt.source_component_id,
      ),
    )
    expect((bounds.min[0] + bounds.max[0]) / 2).toBeCloseTo(-bolt.position.x, 4)
    expect((bounds.min[2] + bounds.max[2]) / 2).toBeCloseTo(bolt.position.y, 4)
    expect(bounds.min[1]).toBeCloseTo(name === "B1" ? -9.2 : -3.8, 4)
    expect(bounds.max[1]).toBeCloseTo(name === "B1" ? 3.8 : 9.2, 4)
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "PCB fastening: bolts seat on real hole centers after board layout",
    layout: "model_focus",
    panels: [
      {
        title:
          "Top: two seated bolts, one bottom bolt, one 2 mm inspection gap",
        code: '<assembly.bolt name="B1"\n  model="m3bolt"\n  fastenedTo=".CONTROL > .H1"/>\n<assembly.bolt name="B2"\n  model="bolt_m3"\n  fastenedTo="CONTROL.H2"/>\n\nB3 fastenedTo=\n  ".CONTROL > .H3 > .bottom"\nB4 fastenedTo=".CONTROL > .H4"\n   mountGap={2}',
        annotation:
          "The hole pattern is rotated 30 degrees and translated to [12,8]. Bolts follow emitted holes, including plated H4.\nB1/B2 heads seat at Z=0.8; B3 seats below at Z=-0.8; B4 floats 2 mm above H4 for inspection.",
        circuit: json,
        legend: [
          { color: "#a9b6c1", label: "JSCAD Electronics M3 x 10 bolts" },
          { color: "#247b42", label: "64 mm PCB + SOIC8 driver" },
          { color: "#2879b7", label: "Machined support + two posts" },
        ],
        callouts: [
          { label: "B3: shaft up", at: [0.75, 0.24], target: [0.665, 0.41] },
          { label: "B4: 2 mm gap", at: [0.74, 0.6], target: [0.583, 0.632] },
        ],
        renderOptions: {
          camPos: [-85, 75, 105],
          poppygl: { lookAt: [-12, -1, 8] },
        },
      },
      {
        title:
          "Underside: B3 head faces down; B1/B2 shafts enter the support posts",
        code: '// Bare hole target = top surface\nfastenedTo=".CONTROL > .H1"\n\n// Explicit opposite surface\nfastenedTo=\n  ".CONTROL > .H3 > .bottom"\n\n// Both aliases resolve to\n// hexsocketbolt_m3_l10mm',
        annotation:
          "Both model aliases use the existing modelcdn socket-head model. The default mating origin is under the head.\nActual exported GLB bounds verify shaft direction and 10 mm length on both PCB surfaces.",
        circuit: json,
        legend: [
          { color: "#a9b6c1", label: "B3: head below, shaft above PCB" },
          { color: "#2879b7", label: "Support window exposes B3" },
        ],
        callouts: [
          { label: "B3: head below", at: [0.75, 0.77], target: [0.689, 0.566] },
        ],
        renderOptions: {
          camPos: [-75, -65, 85],
          poppygl: { lookAt: [-12, -2, 8] },
        },
      },
    ],
  })
})
