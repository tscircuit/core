import { expect, test } from "bun:test"
import {
  Renderable,
  orderedRenderPhases,
} from "lib/components/base-components/Renderable"

test("superscript phase waits for descendant label work and supports dirty updates", async () => {
  let finishTraceRender!: () => void
  const traceRenderFinished = new Promise<void>((resolve) => {
    finishTraceRender = resolve
  })
  class AsyncLabels extends Renderable {
    doInitialSchematicTraceRender() {
      this._queueAsyncEffect("labels", () => traceRenderFinished)
    }
  }
  class SuperscriptRoot extends Renderable {
    initialCalls = 0
    updateCalls = 0
    doInitialSchematicNetLabelSuperscripts() {
      this.initialCalls++
    }
    updateSchematicNetLabelSuperscripts() {
      this.updateCalls++
    }
  }
  const root = new SuperscriptRoot({})
  const child = new AsyncLabels({})
  root.children.push(child)
  child.parent = root
  root.runRenderCycle()
  expect(root.initialCalls).toBe(0)
  expect(root.renderPhaseStates.SchematicNetLabelSuperscripts.initialized).toBe(
    false,
  )
  finishTraceRender()
  await traceRenderFinished
  await Promise.resolve()
  root.runRenderCycle()
  expect(root.initialCalls).toBe(1)
  root.runRenderCycle()
  expect(root.updateCalls).toBe(0)
  child._markDirty("SourceTraceRender")
  expect(root.renderPhaseStates.SchematicNetLabelSuperscripts.dirty).toBe(true)
  root.runRenderCycle()
  expect(root.initialCalls).toBe(1)
  expect(root.updateCalls).toBe(1)
  expect(
    orderedRenderPhases.indexOf("SchematicNetLabelSuperscripts"),
  ).toBeGreaterThan(
    orderedRenderPhases.indexOf("SchematicReplaceNetLabelsWithSymbols"),
  )
})
