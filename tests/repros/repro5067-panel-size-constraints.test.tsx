import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel size limits drive the grid layout", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" maxWidth="30mm" minHeight="100mm">
      {["B1", "B2", "B3", "B4"].map((name) => (
        <board
          key={name}
          name={name}
          width="14mm"
          height="18mm"
          routingDisabled
        >
          <pcbnotetext text={name} fontSize={1} />
        </board>
      ))}
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const [panel] = circuit.db.pcb_panel.list()
  expect({
    panelSize: { width: panel!.width, height: panel!.height },
    boardCentres: circuit.db.pcb_board.list().map((board) => board.center),
    errors: circuit.db.pcb_panelization_placement_error
      .list()
      .map((error) => error.message),
  }).toMatchInlineSnapshot(`
    {
      "boardCentres": [
        {
          "x": -8,
          "y": -10,
        },
        {
          "x": 8,
          "y": -10,
        },
        {
          "x": -8,
          "y": 10,
        },
        {
          "x": 8,
          "y": 10,
        },
      ],
      "errors": [],
      "panelSize": {
        "height": 48,
        "width": 40,
      },
    }
  `)
})
