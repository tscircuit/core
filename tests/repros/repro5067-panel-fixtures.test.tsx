import { expect, test } from "bun:test"
import { renderCircuitJsonOrError } from "tests/fixtures/render-circuit-json-or-error"

test("panel tooling holes and fiducials can be placed in the panel frame", async () => {
  const circuitJson = await renderCircuitJsonOrError(
    <panel layoutMode="grid" edgePadding="5mm">
      <board name="B1" width="14mm" height="18mm" routingDisabled>
        <pcbnotetext text="Panel fixtures" fontSize={0.6} />
      </board>
      <hole diameter="3mm" pcbX={-9.5} pcbY={-6} />
      <fiducial name="F1" padDiameter="1mm" pcbX={9.5} pcbY={6} />
    </panel>,
  )

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
  expect({
    holes: circuitJson.filter((element) => element.type === "pcb_hole").length,
    fiducialPads: circuitJson.filter((element) => element.type === "pcb_smtpad")
      .length,
  }).toMatchInlineSnapshot(`
    {
      "fiducialPads": 1,
      "holes": 1,
    }
  `)
})
