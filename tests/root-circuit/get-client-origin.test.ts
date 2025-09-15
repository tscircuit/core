import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("returns window.location.origin when window is defined", () => {
  const originalWindow = (globalThis as any).window
  const originalSelf = (globalThis as any).self
  ;(globalThis as any).window = { location: { origin: "https://example.com" } }
  ;(globalThis as any).self = (globalThis as any).window

  const circuit = new RootCircuit()
  expect(circuit.getClientOrigin()).toBe("https://example.com")

  if (originalWindow === undefined) {
    delete (globalThis as any).window
  } else {
    ;(globalThis as any).window = originalWindow
  }

  if (originalSelf === undefined) {
    delete (globalThis as any).self
  } else {
    ;(globalThis as any).self = originalSelf
  }
})

test("returns self.location.origin when window is undefined but self exists", () => {
  const originalWindow = (globalThis as any).window
  const originalSelf = (globalThis as any).self
  ;(globalThis as any).window = undefined
  ;(globalThis as any).self = { location: { origin: "https://worker.example" } }

  const circuit = new RootCircuit()
  expect(circuit.getClientOrigin()).toBe("https://worker.example")

  if (originalWindow === undefined) {
    delete (globalThis as any).window
  } else {
    ;(globalThis as any).window = originalWindow
  }

  if (originalSelf === undefined) {
    delete (globalThis as any).self
  } else {
    ;(globalThis as any).self = originalSelf
  }
})
