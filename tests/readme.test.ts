import { it, expect } from "bun:test"
import { Board, Resistor, Project } from "../index"
import { Led } from "lib/components/Led"
import { Trace } from "lib/components/Trace"
import { Net } from "lib/components/Net"

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
    to: LED1.pos,
    thickness: "0.2mm",
  })
  board.add(trace)

  // const gnd = new Net({ name: "GND" })
  // board.add(gnd)

  // const gndTrace = new Trace({
  //   from: LED1.neg,
  //   to: gnd,
  //   thickness: "0.2mm",
  // })
  // board.add(gndTrace)

  project.render()

  // Let's check the db to make sure everything we expect is there

  expect(project.db.source_component.select(".R1")?.name).toBe("R1")
  expect(project.db.source_component.select(".LED1")?.name).toBe("LED1")

  console.log(project.db.pcb_trace.list())

  // console.log(project.getSoup())
})
