import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import { Group } from "lib/components/primitive-components/Group/Group"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("a legacy async extension remains pending after reparenting within the same circuit", async () => {
  const release = loadingRevisionDeferred<void>()
  const callbackCompleted = loadingRevisionDeferred<void>()
  const events: string[] = []
  let callbackStarts = 0
  let callbackCommits = 0
  let didSettle = false
  class LegacyResistor extends Resistor {
    override doInitialSourceRender() {
      super.doInitialSourceRender()
      this._queueAsyncEffect("revision-legacy-reparent-work", async () => {
        callbackStarts++
        events.push("callback_start")
        await release.promise
        this.root!.db.source_component.update(this.source_component_id!, {
          manufacturer_part_number: "legacy-reparent-completed",
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
      if (event.effectName === "revision-legacy-reparent-work")
        events.push("async_start")
    })
    circuit.on("asyncEffect:end", (event) => {
      if (event.effectName === "revision-legacy-reparent-work")
        events.push("async_end")
    })
    circuit.on("renderComplete", () => events.push("render_complete"))
    const board = new Board({ width: 10, height: 10 })
    const originalGroup = new Group({ name: "original_group" })
    const destinationGroup = new Group({ name: "destination_group" })
    const resistor = new LegacyResistor({
      name: "R1",
      resistance: "10k",
      footprint: "0402",
    })
    originalGroup.add(resistor)
    board.add(originalGroup)
    board.add(destinationGroup)
    circuit.add(board)
    const authoredProps = resistor.props
    settled = circuit.renderUntilSettled().then(() => {
      didSettle = true
      events.push("settled")
    })
    await flushLoadingRevisionMicrotasks()
    const registrationRoot = resistor.root
    const beforeReparent = {
      didSettle,
      callbackStarts,
      callbackCommits,
      parentIsOriginalGroup: resistor.parent === originalGroup,
      events: [...events],
    }

    // The public attachment API reassigns parent without a removal operation.
    // Keeping both groups in one board avoids changing the callback's circuit.
    destinationGroup.add(resistor)
    events.push("reparented")
    await flushLoadingRevisionMicrotasks()
    const beforeRelease = {
      didSettle,
      callbackStarts,
      callbackCommits,
      parentIsDestinationGroup: resistor.parent === destinationGroup,
      registrationRootUnchanged: resistor.root === registrationRoot,
      authoredPropsUnchanged: resistor.props === authoredProps,
      events: [...events],
      json: structuredClone(circuit.getCircuitJson()),
    }

    release.resolve()
    await callbackCompleted.promise
    await settled
    const json = circuit.getCircuitJson()
    const sourceRows = json.filter(
      (element) => element.type === "source_component" && element.name === "R1",
    )
    const source = sourceRows[0]
    reportLoadingRevisionObservation("D2", "legacy_same_root_reparent_wait", {
      beforeReparent,
      beforeRelease,
      callbackStarts,
      callbackCommits,
      events,
      source,
      json,
    })

    expect(beforeReparent.didSettle).toBe(false)
    expect(beforeReparent.callbackStarts).toBe(1)
    expect(beforeReparent.callbackCommits).toBe(0)
    expect(beforeReparent.parentIsOriginalGroup).toBe(true)
    expect(beforeReparent.events).toEqual(["callback_start", "async_start"])
    expect(beforeRelease.didSettle).toBe(false)
    expect(beforeRelease.callbackStarts).toBe(1)
    expect(beforeRelease.callbackCommits).toBe(0)
    expect(beforeRelease.parentIsDestinationGroup).toBe(true)
    expect(beforeRelease.registrationRootUnchanged).toBe(true)
    expect(beforeRelease.authoredPropsUnchanged).toBe(true)
    expect(beforeRelease.events).toEqual([
      "callback_start",
      "async_start",
      "reparented",
    ])
    expect(callbackStarts).toBe(1)
    expect(callbackCommits).toBe(1)
    expect(events).toEqual([
      "callback_start",
      "async_start",
      "reparented",
      "callback_commit",
      "async_end",
      "render_complete",
      "settled",
    ])
    expect(sourceRows).toHaveLength(1)
    expect(
      source?.type === "source_component" && source.manufacturer_part_number,
    ).toBe("legacy-reparent-completed")
    expect(
      json.filter((element) => element.type === "pcb_smtpad"),
    ).toHaveLength(2)
  } finally {
    release.resolve()
    await settled
    await disposeLoadingRevisionCircuit(circuit)
  }
})
