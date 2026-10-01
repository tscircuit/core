import { expect, test } from "bun:test"
import type { FootprintLibraryResult } from "@tscircuit/props"
import { RootCircuit } from "lib/RootCircuit"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import { Subcircuit } from "lib/components/primitive-components/Group/Subcircuit/Subcircuit"
import footprintJson from "tests/fixtures/assets/external-0402-footprint.json"
import "lib/register-catalogue"

test("disposing a parent interrupts and disposes its final shared child render before a late result", async () => {
  const footprint = Promise.withResolvers<FootprintLibraryResult>()
  const circuit = new RootCircuit({
    platform: {
      schematicDisabled: true,
      routingDisabled: true,
      drcChecksDisabled: true,
      footprintLibraryMap: { mock: () => footprint.promise },
    },
  })
  const board = new Board({ width: 12, height: 8, routingDisabled: true })
  const subcircuit = new Subcircuit({
    name: "S1",
    _subcircuitCachingEnabled: true,
  })
  const resistor = new Resistor({
    name: "R1",
    resistance: "1k",
    footprint: "mock:shared",
  })
  subcircuit.add(resistor)
  board.add(subcircuit)
  circuit.add(board)
  circuit.render()
  const childCircuit = resistor.root!
  const previousChildren = resistor.children.length
  expect(circuit.pendingSubcircuitRenders!.size).toBe(1)
  await circuit.dispose()
  expect(childCircuit.effectRuntime.isDisposed).toBe(true)
  expect(childCircuit.effectRuntime.activeJobCount).toBe(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  expect(circuit.pendingSubcircuitRenders!.size).toBe(0)
  footprint.resolve({ footprintCircuitJson: footprintJson })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(resistor.children.length).toBe(previousChildren)
  expect(circuit.cachedSubcircuits!.size).toBe(0)
})
