import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("a legacy async extension remains pending through its owner's valid props replacement", async () => {
  const release = loadingRevisionDeferred<void>()
  const callbackCompleted = loadingRevisionDeferred<void>()
  const events: string[] = []
  let callbackStarts = 0
  let callbackCommits = 0
  let didSettle = false
  class LegacyResistor extends Resistor {
    override doInitialSourceRender() {
      super.doInitialSourceRender()
      this._queueAsyncEffect("revision-legacy-held-work", async () => {
        callbackStarts++
        events.push("callback_start")
        await release.promise
        this.root!.db.source_component.update(this.source_component_id!, {
          manufacturer_part_number: "legacy-completed",
        })
        callbackCommits++
        events.push("callback_commit")
        callbackCompleted.resolve()
      })
    }
  }
  const circuit = createLoadingRevisionCircuit({ drcChecksDisabled: true })
  let settled: Promise<void> | undefined
  try {
    circuit.on("asyncEffect:start", (event) => {
      if (event.effectName === "revision-legacy-held-work")
        events.push("async_start")
    })
    circuit.on("asyncEffect:end", (event) => {
      if (event.effectName === "revision-legacy-held-work")
        events.push("async_end")
    })
    circuit.on("renderComplete", () => events.push("render_complete"))
    const board = new Board({ width: 10, height: 10 })
    const resistor = new LegacyResistor({
      name: "R1",
      resistance: "10k",
      footprint: "0402",
    })
    board.add(resistor)
    circuit.add(board)
    settled = circuit.renderUntilSettled().then(() => {
      didSettle = true
      events.push("settled")
    })
    resistor.setProps({ ...resistor.props, pcbX: 2 })
    await flushLoadingRevisionMicrotasks()
    const beforeRelease = {
      didSettle,
      callbackStarts,
      callbackCommits,
      events: [...events],
      json: structuredClone(circuit.getCircuitJson()),
    }
    release.resolve()
    await callbackCompleted.promise
    await settled
    const json = circuit.getCircuitJson()
    const source = json.find(
      (element) => element.type === "source_component" && element.name === "R1",
    )
    reportLoadingRevisionObservation("S1", "legacy_own_props_wait", {
      beforeRelease,
      callbackStarts,
      callbackCommits,
      events,
      source,
      json,
    })

    expect(beforeRelease.didSettle).toBe(false)
    expect(beforeRelease.callbackStarts).toBe(1)
    expect(beforeRelease.callbackCommits).toBe(0)
    expect(beforeRelease.events).toEqual(["callback_start", "async_start"])
    expect(callbackStarts).toBe(1)
    expect(callbackCommits).toBe(1)
    expect(events).toEqual([
      "callback_start",
      "async_start",
      "callback_commit",
      "async_end",
      "render_complete",
      "settled",
    ])
    expect(
      source?.type === "source_component" && source.manufacturer_part_number,
    ).toBe("legacy-completed")
    expect(
      json.filter((element) => element.type === "pcb_smtpad"),
    ).toHaveLength(2)
  } finally {
    release.resolve()
    await settled
    await disposeLoadingRevisionCircuit(circuit)
  }
})
