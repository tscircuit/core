import type {
  PcbCircuitElement,
  PcbPostRoutingHookContext,
  SubcircuitGroupProps,
} from "@tscircuit/props"
import * as circuitJsonSchemas from "circuit-json"
import type { AnyCircuitElement, PcbComponent, PcbPort } from "circuit-json"
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

export interface PcbPostRoutingHookState {
  /** Every change the current run made, in order, so it can be undone */
  journal: JournalEntry[]
  /** Increments whenever a run is superseded; a stale run's context refuses edits */
  generation: number
}

const getState = (group: Group<any>): PcbPostRoutingHookState => {
  group._pcbPostRoutingHookState ??= { journal: [], generation: 0 }
  return group._pcbPostRoutingHookState
}

const getTable = (group: Group<any>, type: string) => {
  const table = (group.root!.db as any)[type]
  if (!table?.insert) {
    throw new Error(`pcbPostRoutingHook: unknown element type "${type}"`)
  }
  return table as {
    insert: (elm: any) => any
    update: (id: string, patch: any) => any
    delete: (id: string) => void
  }
}

const findElement = (group: Group<any>, id: string): AnyCircuitElement => {
  const element = group
    .root!.db.toArray()
    .find((elm) => (elm as any)[`${elm.type}_id`] === id)
  if (!element) {
    throw new Error(`pcbPostRoutingHook: no element with id "${id}"`)
  }
  if (!element.type.startsWith("pcb_")) {
    throw new Error(
      `pcbPostRoutingHook: only pcb_* elements can be changed, "${id}" is a ${element.type}`,
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
      `pcbPostRoutingHook: invalid ${type}: ${result.error.message}`,
    )
  }
  return result.data as Record<string, unknown>
}

/** Undoes the hook's recorded changes, newest first, restoring the routed board. */
export function Group_undoPcbPostRoutingHook(group: Group<any>): void {
  const state = group._pcbPostRoutingHookState
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
  state: PcbPostRoutingHookState,
): PcbPostRoutingHookContext => {
  const generation = state.generation
  const assertCurrent = () => {
    if (state.generation !== generation) {
      throw new Error(
        "pcbPostRoutingHook: this run was superseded (the board changed and the hook runs again); its changes are discarded",
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
          `pcbPostRoutingHook: insert takes pcb_* elements, not "${type}"`,
        )
      }
      const idKey = `${type}_id`
      if (idKey in element) {
        throw new Error(
          `pcbPostRoutingHook: ${idKey} is generated; leave it out`,
        )
      }
      const { [idKey]: _candidate, ...parsed } = validate({
        subcircuit_id: group.subcircuit_id ?? undefined,
        ...element,
        [idKey]: `${type}_post_routing_hook_candidate`,
      })
      const inserted = getTable(group, type).insert(parsed)
      state.journal.push({ kind: "insert", type, id: inserted[idKey] })
      return structuredClone(inserted)
    }) as PcbPostRoutingHookContext["insert"],
    update: (id, patch) => {
      assertCurrent()
      const element = findElement(group, id) as Record<string, any>
      const idKey = `${element.type}_id`
      if ("type" in patch || idKey in patch) {
        throw new Error(
          `pcbPostRoutingHook: update cannot change type or ${idKey}`,
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
const recordHookError = (
  group: Group<any>,
  state: PcbPostRoutingHookState,
  error: unknown,
) => {
  const message = error instanceof Error ? error.message : String(error)
  const inserted = group.root!.db.pcb_autorouting_error.insert({
    pcb_error_id: `pcb_post_routing_hook_error_${group.subcircuit_id}`,
    error_type: "pcb_autorouting_error",
    message: `pcbPostRoutingHook failed: ${message}`,
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
 * Runs the subcircuit's pcbPostRoutingHook once routing and teardrops are done,
 * before copper pours, via stitching and PCB design rule checks. A sync hook
 * runs inline; an async hook runs as an async effect the later phases wait for.
 * Before a re-run the previous run's changes are undone (see Group._markDirty).
 */
export function Group_doInitialPcbPostRoutingHookRender(
  group: Group<any>,
): void {
  const hook = (group._parsedProps as SubcircuitGroupProps).pcbPostRoutingHook
  if (!hook || !group.isSubcircuit || !group.root) return
  if (group.root.pcbDisabled || group._isInflatedFromCircuitJson) return
  // never show user code a half-routed board; routing completion re-runs this phase
  if (group._isPcbRoutingPending()) return

  const state = getState(group)
  // normally already undone when the phase was marked dirty
  Group_undoPcbPostRoutingHook(group)
  const generation = state.generation
  const context = createContext(group, state)

  let result: void | Promise<void>
  try {
    result = hook(context)
  } catch (error) {
    recordHookError(group, state, error)
    return
  }
  if (!(result instanceof Promise)) return
  group._queueAsyncEffect("pcb-post-routing-hook", async () => {
    try {
      await result
    } catch (error) {
      // a superseded run's failure is expected and its changes are discarded
      if (state.generation === generation) recordHookError(group, state, error)
    }
  })
}
