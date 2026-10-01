import { expect, test } from "bun:test"
import type { FootprintLibraryResult } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import { Subcircuit } from "lib/components/primitive-components/Group/Subcircuit/Subcircuit"
import footprintJson from "tests/fixtures/assets/external-0402-footprint.json"
import "lib/register-catalogue"

test("disposing a producer circuit preserves a shared child render needed by another circuit", async () => {
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cached = new Map<string, AnyCircuitElement[]>()
  const footprint = Promise.withResolvers<FootprintLibraryResult>()
  let loads = 0
  const createCircuit = () => {
    const circuit = new IsolatedCircuit({
      cachedSubcircuits: cached,
      pendingSubcircuitRenders: pending,
      platform: {
        schematicDisabled: true,
        routingDisabled: true,
        drcChecksDisabled: true,
        footprintLibraryMap: {
          mock: () => {
            loads++
            return footprint.promise
          },
        },
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
    return { circuit, resistor }
  }
  const first = createCircuit()
  const second = createCircuit()
  first.circuit.render()
  second.circuit.render()
  expect(loads).toBe(1)
  expect(pending.size).toBe(1)
  const childCircuit = first.resistor.root!
  expect(childCircuit).not.toBe(first.circuit)
  await first.circuit.dispose()
  expect(first.circuit.effectRuntime.activeJobCount).toBe(0)
  expect(childCircuit.effectRuntime.isDisposed).toBe(false)
  expect(pending.size).toBe(1)
  footprint.resolve({ footprintCircuitJson: footprintJson })
  await second.circuit.renderUntilSettled()
  expect(second.circuit.db.source_component.list()).toHaveLength(1)
  expect(second.circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(cached.size).toBe(1)
  expect(pending.size).toBe(0)
  expect(childCircuit.effectRuntime.isDisposed).toBe(true)
  expect(childCircuit.effectRuntime.activeJobCount).toBe(0)
  await second.circuit.dispose()
})
