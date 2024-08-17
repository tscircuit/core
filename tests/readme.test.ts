import { it, expect } from "bun:test"
import { Board, Resistor, Led, Trace, Project } from "../index"

it("should create soup with various elements", () => {
  const project = new Project()

  const board = new Board({
    width: "10mm",
    height: "10mm",
  })
  project.add(board)

  const R1 = new Resistor({ resistance: "10k", footprint: "0402" })
  const LED1 = new Led({ footprint: "0402" })

  board.add(R1)
  board.add(LED1)

  const trace = new Trace({ width: "0.2mm" })
  trace.connect(R1.output, LED1.anode)
  board.add(trace)

  console.log(project.getSoup())
})
