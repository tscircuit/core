import type { PcbCircuitElement, PcbPostRoutingContext } from "@tscircuit/props"
import * as circuitJsonSchemas from "circuit-json"
import type { AnyCircuitElement, PcbComponent, PcbPort } from "circuit-json"
import type { PcbPostRoutingStep } from "../PcbPostRoutingStep"
import type { Group } from "./Group"

type JournalEntry =
  | { kind: "insert"; type: string; id: string }
  | {
      kind: "update"
      type: string
      id: string
      /** Previous values of the patched keys; undefined restores an absent key */
      before: Record<string, unknown>
    }
  | { kind: "remove"; type: string; element: AnyCircuitElement }

export interface PcbPostRoutingStepState {
  /** Every change the current run made, in order, so it can be undone */
  journal: JournalEntry[]
  /** Increments whenever a run is superseded; a stale run's context refuses edits */
  generation: number
}

const getState = (group: Group<any>): PcbPostRoutingStepState => {
  group._pcbPostRoutingStepState ??= { journal: [], generation: 0 }
  return group._pcbPostRoutingStepState
}

const idOf = (element: AnyCircuitElement) =>
  (element as any)[`${element.type}_id`] as string

const getTable = (group: Group<any>, type: string) => {
  const table = (group.root!.db as any)[type]
  if (!table?.insert) {
    throw new Error(`pcbpostroutingstep: unknown element type "${type}"`)
  }
  return table as {
    insert: (elm: any) => any
    update: (id: string, patch: any) => any
    delete: (id: string) => void
  }
}

const findElement = (group: Group<any>, id: string): AnyCircuitElement => {
  const element = group.root!.db.toArray().find((elm) => idOf(elm) === id)
  if (!element) {
    throw new Error(`pcbpostroutingstep: no element with id "${id}"`)
  }
  if (!element.type.startsWith("pcb_")) {
    throw new Error(
      `pcbpostroutingstep: only pcb_* elements can be changed, "${id}" is a ${element.type}`,
    )
  }
  return element
}

/** Validates an element against its circuit-json schema; returns the parsed (defaulted) element. */
const validate = (element: Record<string, unknown>) => {
  const type = element.type as string
  const schema =
    (circuitJsonSchemas as any)[type] ?? circuitJsonSchemas.any_circuit_element
  const result = schema.safeParse(element)
  if (!result.success) {
    throw new Error(
      `pcbpostroutingstep: invalid ${type}: ${result.error.message}`,
    )
  }
  return result.data as Record<string, unknown>
}

/** Undoes the steps' recorded changes, newest first, restoring the routed board. */
export function Group_undoPcbPostRoutingSteps(group: Group<any>): void {
  const state = group._pcbPostRoutingStepState
  if (!state || !group.root) return
  state.generation++
  const journal = state.journal
  state.journal = []
  for (const entry of journal.reverse()) {
    const table = getTable(group, entry.type)
    if (entry.kind === "insert") {
      table.delete(entry.id)
    } else if (entry.kind === "update") {
      table.update(entry.id, entry.before)
    } else {
      // insert keeps the element's own id
      table.insert(entry.element)
    }
  }
}

const createContext = (
  group: Group<any>,
  state: PcbPostRoutingStepState,
  generation: number,
): PcbPostRoutingContext => {
  const assertCurrent = () => {
    if (state.generation !== generation) {
      throw new Error(
        "pcbpostroutingstep: this run was superseded (the board changed and the steps run again); its changes are discarded",
      )
    }
  }
  const { db } = group.root!
  const pcbPortFor = (selector: string) => {
    const port = group.selectOne(selector, { port: true }) as {
      pcb_port_id?: string | null
    } | null
    return port?.pcb_port_id ? db.pcb_port.get(port.pcb_port_id) : null
  }

  return {
    subcircuitId: group.subcircuit_id ?? undefined,
    getCircuitJson: () =>
      structuredClone(group.root!.db.toArray()) as AnyCircuitElement[],
    getPcbPort: (selector) =>
      (structuredClone(pcbPortFor(selector)) as PcbPort | null) ?? undefined,
    getPcbComponent: (selector) => {
      const component = group.selectOne(selector) as {
        pcb_component_id?: string | null
      } | null
      const pcbComponent = component?.pcb_component_id
        ? db.pcb_component.get(component.pcb_component_id)
        : null
      return (structuredClone(pcbComponent) as PcbComponent | null) ?? undefined
    },
    insert: ((element: Record<string, unknown>) => {
      assertCurrent()
      const type = String(element.type ?? "")
      if (!type.startsWith("pcb_")) {
        throw new Error(
          `pcbpostroutingstep: insert takes pcb_* elements, not "${type}"`,
        )
      }
      const idKey = `${type}_id`
      if (idKey in element) {
        throw new Error(
          `pcbpostroutingstep: ${idKey} is generated; leave it out`,
        )
      }
      const { [idKey]: _candidate, ...parsed } = validate({
        subcircuit_id: group.subcircuit_id ?? undefined,
        ...element,
        [idKey]: `${type}_post_routing_candidate`,
      })
      const inserted = getTable(group, type).insert(parsed)
      state.journal.push({ kind: "insert", type, id: inserted[idKey] })
      return structuredClone(inserted)
    }) as PcbPostRoutingContext["insert"],
    update: (id, patch) => {
      assertCurrent()
      const element = findElement(group, id) as Record<string, any>
      const idKey = `${element.type}_id`
      if ("type" in patch || idKey in patch) {
        throw new Error(
          `pcbpostroutingstep: update cannot change type or ${idKey}`,
        )
      }
      validate({ ...element, ...patch })
      const before = Object.fromEntries(
        Object.keys(patch).map((key) => [key, element[key]]),
      )
      getTable(group, element.type).update(id, patch)
      state.journal.push({ kind: "update", type: element.type, id, before })
      return structuredClone(findElement(group, id)) as PcbCircuitElement
    },
    remove: (id) => {
      assertCurrent()
      const element = findElement(group, id)
      state.journal.push({
        kind: "remove",
        type: element.type,
        element: structuredClone(element),
      })
      getTable(group, element.type).delete(id)
    },
  }
}

/** Records a failure as a pcb_autorouting_error; journaled, so a re-run replaces it. */
const recordStepError = (
  group: Group<any>,
  state: PcbPostRoutingStepState,
  step: PcbPostRoutingStep,
  error: unknown,
) => {
  const message = error instanceof Error ? error.message : String(error)
  const name = step._parsedProps.name
  const inserted = group.root!.db.pcb_autorouting_error.insert({
    pcb_error_id: `pcb_post_routing_step_error_${step._renderId}`,
    error_type: "pcb_autorouting_error",
    message: `<pcbpostroutingstep${name ? ` name="${name}"` : ""} /> failed: ${message}`,
    subcircuit_id: group.subcircuit_id ?? undefined,
  })
  state.journal.push({
    kind: "insert",
    type: "pcb_autorouting_error",
    // the db keys every table by <type>_id, alongside the schema's pcb_error_id
    id: (inserted as unknown as { pcb_autorouting_error_id: string })
      .pcb_autorouting_error_id,
  })
}

/**
 * The steps this board or subcircuit runs, including those inside its
 * components. selectAll stops at nested subcircuits, which run their own.
 */
const getSteps = (group: Group<any>): PcbPostRoutingStep[] => {
  const steps = group.selectAll("pcbpostroutingstep") as PcbPostRoutingStep[]
  // Array.prototype.sort is stable: equal orders keep document order
  return steps.sort(
    (a, b) => (a._parsedProps.order ?? 0) - (b._parsedProps.order ?? 0),
  )
}

/**
 * Runs the subcircuit's <pcbpostroutingstep /> elements, in order, once routing
 * and teardrops are done and before copper pours, via stitching and PCB design
 * rule checks. Steps run inline until one returns a promise; that step and the
 * rest then run in order as one async effect the later phases wait for.
 * Before a re-run the previous run's changes are undone (see Group._markDirty).
 */
export function Group_doInitialPcbPostRoutingStepRender(
  group: Group<any>,
): void {
  if (!group.isSubcircuit || !group.root) return
  if (group.root.pcbDisabled || group._isInflatedFromCircuitJson) return
  // never show user code a half-routed board; routing completion re-runs this phase
  if (group._isPcbRoutingPending()) return
  const steps = getSteps(group)
  if (steps.length === 0) return

  const state = getState(group)
  // normally already undone when the phase was marked dirty
  Group_undoPcbPostRoutingSteps(group)
  const generation = state.generation
  const context = createContext(group, state, generation)
  const isCurrent = () => state.generation === generation

  const runStep = (step: PcbPostRoutingStep): void | Promise<void> =>
    step._parsedProps.fn?.(context)

  for (let i = 0; i < steps.length; i++) {
    let result: void | Promise<void>
    try {
      result = runStep(steps[i])
    } catch (error) {
      recordStepError(group, state, steps[i], error)
      continue
    }
    if (!(result instanceof Promise)) continue
    const pending = result
    const rest = steps.slice(i + 1)
    group._queueAsyncEffect("pcb-post-routing-steps", async () => {
      try {
        await pending
      } catch (error) {
        // a superseded run's failure is expected and its changes are discarded
        if (isCurrent()) recordStepError(group, state, steps[i], error)
      }
      for (const step of rest) {
        if (!isCurrent()) return
        try {
          await runStep(step)
        } catch (error) {
          if (isCurrent()) recordStepError(group, state, step, error)
        }
      }
    })
    return
  }
}
