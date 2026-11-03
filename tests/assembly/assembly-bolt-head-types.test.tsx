import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { withLocalBoltMesh } from "./fixtures/with-local-bolt-mesh"

const heads = ["socket", "hex", "pan", "countersunk"] as const
const functions = [
  "hexsocketbolt",
  "hexbolt",
  "panscrew",
  "flatheadscrew",
] as const

test("dimensional bolts render each supported standard head type", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="PLATE"
        jscad={
          <jscad.colorize color="#2879b7">
            <jscad.subtract>
              <jscad.roundedCuboid
                size={[76, 28, 4]}
                roundRadius={1}
                center={[0, 0, 2]}
              />
              {[-27, -9, 9, 27].map((x) => (
                <jscad.cylinder
                  key={x}
                  radius={1.7}
                  height={8}
                  center={[x, 0, 2]}
                />
              ))}
              <jscad.hull>
                <jscad.cylinder
                  radius={3.1}
                  height={0.1}
                  center={[27, 0, 4.05]}
                />
                <jscad.cylinder
                  radius={1.6}
                  height={0.1}
                  center={[27, 0, 2.5]}
                />
              </jscad.hull>
            </jscad.subtract>
          </jscad.colorize>
        }
      >
        {heads.map((headType, i) => (
          <assembly.referencesurface
            key={headType}
            name={headType}
            centerXOffset={-27 + i * 18}
            centerZOffset={4}
          />
        ))}
      </assembly.printedpart>
      {heads.map((headType, i) => (
        <assembly.bolt
          key={headType}
          name={headType}
          diameter="3mm"
          length="1cm"
          headType={headType}
          threadPitch={0.5}
          fastenedTo={`.PLATE > .${headType}`}
        />
      ))}
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  for (const [i, head] of heads.entries()) {
    const source = circuit.db.source_component
      .list()
      .find((source) => source.name === head)!
    const cad = circuit.db.cad_component
      .list()
      .find((cad) => cad.source_component_id === source.source_component_id)!
    expect(cad.position.x).toBeCloseTo(-27 + i * 18)
    expect(cad.position.z).toBeCloseTo(4)
    expect(cad.model_glb_url).toBe(
      `https://modelcdn.tscircuit.com/jscad_models/${functions[i]}_m3_l10mm${i === 0 ? "" : "_threadpitch0.5mm"}.glb`,
    )
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Dimensional fastening: standard M3 bolt and screw head geometries",
    layout: "model_focus",
    panels: [
      {
        title: "Left to right: countersunk, pan, hex and socket heads",
        code: '<assembly.bolt\n  diameter="3mm" length="1cm"\n  headType="socket"\n  fastenedTo=".PLATE > .socket"/>\n\n// Also supported:\nheadType="hex"\nheadType="pan"\nheadType="countersunk"\n\n// Optional standard thread pitch\nthreadPitch={0.5}',
        annotation:
          "Real JSCAD Electronics models, generated from modelprinter definitions. Plate has three through-holes and a countersink.\nLength excludes the head for socket/hex/pan; countersunk length includes its head. All seating datums are at Z=4 mm.",
        circuit: await withLocalBoltMesh(circuit.getCircuitJson()),
        legend: [
          { color: "#a9b6c1", label: "Four standard head geometries" },
          { color: "#2879b7", label: "Machined plate with countersink" },
        ],
        renderOptions: {
          camPos: [60, 48, 80],
          poppygl: { lookAt: [0, 1, 0] },
        },
      },
    ],
  })
})
