import { test, expect } from "bun:test"
import { Circuit } from "lib"

test("snippet-import1-contribution-board", async () => {
  const circuit = new Circuit()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        {1}
      </board>,
    )
  }).toThrowError("Invalid JSX Element")
})

test("stray text error names the offending parent component", async () => {
  const circuit = new Circuit()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        hello world
      </board>,
    )
  }).toThrowError('<Board> received stray text "hello world"')
})

test("NaN-valued text child gets an actionable hint", async () => {
  const circuit = new Circuit()

  const value = Number.NaN

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        {`${value}p`}
      </board>,
    )
  }).toThrowError("evaluated to NaN")
})
