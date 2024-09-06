import { it, expect } from "bun:test"
import { Board, Resistor, Circuit, SilkscreenPath } from "../index"
import { Led } from "lib/components/normal-components/Led"
import "lib/register-catalogue"

it("should create soup with various elements", () => {
  const project = new Circuit()

  const board = new Board({
    width: "10mm",
    height: "10mm",
  })
  project.add(board)

  const R1 = new Resistor({ name: "R1", resistance: "10k", footprint: "0402" })
  board.add(R1)

  board.add(<led name="LED1" footprint="0402" />)

  const silkscreenPath = new SilkscreenPath({
    path: "M0 0 L10 10",
    layer: "top",
    width: "0.2mm",
  })
  board.add(silkscreenPath)

  project.render()

  // Let's check the db to make sure everything we expect is there

  expect(project.db.source_component.select(".R1")?.name).toBe("R1")
  // expect(project.db.source_component.select(".LED1")?.name).toBe("LED1")

  expect(project.db.pcb_smtpad.list()).toHaveLength(4)

  // Check for the silkscreen path
  const silkscreenComponent = project.db.source_component.find(
    (c) => c.type === "silkscreenpath"
  )
  expect(silkscreenComponent).toBeTruthy()
  expect(silkscreenComponent?.path).toBe("M0 0 L10 10")
  expect(silkscreenComponent?.layer).toBe("top")
  expect(silkscreenComponent?.width).toBe("0.2mm")

  // console.log("pcb_trace", project.db.pcb_trace.list())

  // console.log(project.getSoup())
})
