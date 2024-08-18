import { it, expect } from "bun:test"
import { Board, Resistor, Project } from "../index"
import { Led } from "lib/components/Led"
import { Trace } from "lib/components/Trace"

it("should create soup with various elements", () => {
  const project = new Project()

  const board = new Board({
    width: "10mm",
    height: "10mm",
  })
  project.add(board)

  const R1 = new Resistor({ name: "R1", resistance: "10k", footprint: "0402" })
  board.add(R1)

  const LED1 = new Led({ name: "LED1", footprint: "0402" })
  board.add(LED1)

  const trace = new Trace({
    from: R1.pin1,
    to: LED1.anode,
    thickness: "0.2mm",
  })
  board.add(trace)

  project.render()

  console.log(project.getSoup())
})
