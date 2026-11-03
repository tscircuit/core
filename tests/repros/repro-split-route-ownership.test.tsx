import { expect, test } from "bun:test"
import {
  checkDanglingTraces,
  checkEachPcbTraceNonOverlapping,
  checkTracesAreContiguous,
} from "@tscircuit/checks"
import { cju } from "@tscircuit/circuit-json-util"
import { Board } from "lib/components/normal-components/Board/Board"
import PocketAudioPlayer from "tests/fixtures/pocket-audio-player/board/index.circuit"
import { savedRouting } from "tests/fixtures/pocket-audio-player/btn-play-routes"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved audio-board BTN_PLAY pieces lose ownership during route import", async () => {
  // Saved BTN_PLAY response and placement from the earlier six-layer audio board.
  // Coordinates are board-world points in mm, +X right, +Y up, right-handed.
  const importedCircuits = []
  for (const restoreOwnership of [false, true]) {
    const { circuit } = getTestFixture()
    // Render the original component TSX. Its saved-route workaround is bypassed
    // only in the test, so Core receives the original failing router response.
    circuit.pcbRoutingDisabled = true
    circuit.schematicDisabled = true
    circuit.add(<PocketAudioPlayer />)
    await circuit.renderUntilSettled()
    const board = circuit.firstChild as Board
    const playNet = circuit.db.source_net
      .list()
      .find((net) => net.name === "BTN_PLAY")!
    expect(savedRouting.connectionName).toBe(playNet.source_net_id)
    for (const anchor of savedRouting.anchors) {
      const port = circuit.db.pcb_port.get(anchor.portId)!
      expect({ x: port.x, y: port.y }).toEqual({ x: anchor.x, y: anchor.y })
      expect(port.layers).toContain(anchor.layer)
    }
    // Isolate BTN_PLAY diagnostics from other nets and previously emitted copper.
    // Every component, pad, source connection and board position comes from TSX.
    circuit.db = cju(
      circuit
        .getCircuitJson()
        .filter(
          (element) =>
            ![
              "pcb_trace",
              "pcb_via",
              "pcb_copper_pour",
              "pcb_debug_object",
            ].includes(element.type) &&
            !element.type.endsWith("_error") &&
            !element.type.endsWith("_warning"),
        ),
    )
    const routedTraces = structuredClone(savedRouting.traces)
    if (restoreOwnership) {
      // Control: preserve every route point and supply the known net identity
      // only where the first import could not infer ownership.
      for (const trace of routedTraces) {
        trace.source_trace_id =
          importedCircuits[0].db.pcb_trace.get(trace.pcb_trace_id)
            ?.source_trace_id ?? playNet.source_net_id
      }
    }
    board._asyncAutoroutingResult = { output_pcb_traces: routedTraces }
    board._updatePcbTraceRenderFromPcbTraces()
    importedCircuits.push(circuit)

    const circuitJson = circuit.getCircuitJson()
    const contactErrors = checkEachPcbTraceNonOverlapping(circuitJson)
    const disconnectedErrors = checkTracesAreContiguous(circuitJson)
    const danglingErrors = checkDanglingTraces(circuitJson)
    expect(contactErrors).toHaveLength(restoreOwnership ? 0 : 12)
    expect(disconnectedErrors).toHaveLength(restoreOwnership ? 1 : 8)
    expect(danglingErrors).toHaveLength(restoreOwnership ? 1 : 8)
    if (restoreOwnership) {
      // This historical capture has one endpoint warning even with ownership.
      // Keep it visible: the control is not a zero-DRC/fabrication claim.
      expect(disconnectedErrors[0].center).toEqual({ x: 7.785, y: 15.75 })
      expect(danglingErrors[0].center).toEqual(disconnectedErrors[0].center)
    }

    const noteLines = [
      restoreOwnership
        ? "CONTROL: same copper, ownership supplied"
        : "SAVED AUDIO BOARD: ownership lost on 5 pieces",
      `BTN_PLAY: ${contactErrors.length} contact, ${disconnectedErrors.length} disconnected, ${danglingErrors.length} dangling warnings`,
      "SW2 play-button bridge on inner2; through vias at both ends",
      "Warning counts cover the entire saved BTN_PLAY route",
    ]
    for (const [lineIndex, text] of noteLines.entries()) {
      circuit.db.pcb_note_text.insert({
        text,
        font: "tscircuit2024",
        font_size: 0.22,
        anchor_position: { x: 0, y: -11 - lineIndex * 0.5 },
        anchor_alignment: "center",
        layer: "top",
      })
    }
    // Native error labels overlap here; notes report all asserted counts.
    // The overview shows the real placement; the crop exposes inner2 copper.
    const snapshotOptions = {
      shouldDrawErrors: false,
      showSolderMask: false,
      showSolderPaste: false,
      showDebugObjects: false,
      showFabricationNotes: false,
      showCourtyards: false,
    }
    const snapshotPath = import.meta.path.replace(".test.tsx", "")
    if (!restoreOwnership) {
      circuit.db.pcb_note_text.insert({
        text: "Pocket Audio Player: saved BTN_PLAY route only",
        font: "tscircuit2024",
        font_size: 1,
        anchor_position: { x: 0, y: 46 },
        anchor_alignment: "center",
        layer: "top",
      })
      await expect(circuit).toMatchPcbSnapshot(`${snapshotPath}-board`, {
        ...snapshotOptions,
        width: 900,
        height: 1300,
      })
    }
    await expect(circuit).toMatchPcbSnapshot(
      `${snapshotPath}-${restoreOwnership ? "control" : "split"}`,
      {
        ...snapshotOptions,
        layer: "inner2",
        viewport: { minX: -5, maxX: 5, minY: -18, maxY: -10 },
        width: 1000,
        height: 800,
      },
    )
  }

  const [splitCircuit, controlCircuit] = importedCircuits
  const splitTraces = splitCircuit.db.pcb_trace.list()
  const controlTraces = controlCircuit.db.pcb_trace.list()
  expect(splitTraces).toHaveLength(savedRouting.traces.length)
  expect(splitTraces.filter((trace) => !trace.source_trace_id)).toHaveLength(5)
  expect(controlTraces.every((trace) => trace.source_trace_id)).toBe(true)
  expect(splitTraces.map((trace) => trace.route)).toEqual(
    controlTraces.map((trace) => trace.route),
  )
  expect(splitCircuit.db.pcb_via.list()).toEqual(
    controlCircuit.db.pcb_via.list(),
  )
}, 60_000)
