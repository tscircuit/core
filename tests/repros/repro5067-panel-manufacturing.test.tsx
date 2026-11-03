import { expect, test } from "bun:test"
import { catalogue } from "lib/fiber/catalogue"
import { Fiducial, Hole, Panel, SilkscreenText } from "lib/components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel rails and manufacturing fixtures are available outside child boards", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid">
      <board width="14mm" height="18mm" routingDisabled>
        <pcbnotetext text="Bare panel baseline" fontSize={0.8} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Check construction separately: an unknown React catalogue element would
  // abort the reconciler before the remaining missing facilities are visible.
  const panel = new Panel({})
  expect(() => panel.add(new Hole({ diameter: "3mm" }))).not.toThrow()
  expect(() =>
    panel.add(new Fiducial({ name: "F1", padDiameter: "1mm" })),
  ).not.toThrow()
  expect(() =>
    panel.add(new SilkscreenText({ text: "PANEL ID" })),
  ).not.toThrow()
  expect(catalogue.Toolingrail).toBeDefined()
})
