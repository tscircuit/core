import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit footprint stencils replace automatic SMT and plated-hole paste only when requested", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      {([undefined, false, true] as const).map((noSolderPaste, column) => (
        <chip
          key={column}
          name={`J${column + 1}`}
          pcbX={-8 + column * 8}
          footprint={
            <footprint noSolderPaste={noSolderPaste}>
              <smtpad
                shape="rect"
                width={2}
                height={1}
                portHints={["1"]}
                pcbY={2}
              />
              <platedhole
                shape="pill"
                outerWidth={2}
                outerHeight={1}
                holeWidth={1.5}
                holeHeight={0.5}
                portHints={["2"]}
              />
              <platedhole
                shape="circle"
                outerDiameter={1.5}
                holeDiameter={0.8}
                portHints={["3"]}
                pcbY={-2}
              />
              <solderpaste
                shape="polygon"
                points={[
                  { x: -1, y: 1.5 },
                  { x: 1, y: 1.5 },
                  { x: 0, y: 2.5 },
                ]}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="Default / false: automatic + explicit; true: explicit stencil only"
        pcbY={-5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(apertures).toHaveLength(13)
  expect(apertures.filter((paste) => paste.shape === "polygon")).toHaveLength(3)
  expect(
    apertures.filter((paste) => paste.shape !== "polygon" && paste.x > 4),
  ).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(3)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
