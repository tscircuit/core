import type {
  PcbPostRoutingHookContext,
  SubcircuitGroupProps,
} from "@tscircuit/props"
import * as circuitJsonSchemas from "circuit-json"
import type { AnyCircuitElement, PcbComponent, PcbPort } from "circuit-json"
import type { Group } from "./Group"

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

const createContext = (group: Group<any>): PcbPostRoutingHookContext => {
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
      return structuredClone(inserted)
    }) as PcbPostRoutingHookContext["insert"],
  } as PcbPostRoutingHookContext
}

/**
 * Runs the subcircuit's pcbPostRoutingHook once routing and teardrops are done,
 * before copper pours, via stitching and PCB design rule checks. A sync hook
 * runs inline; an async hook runs as an async effect the later phases wait for.
 */
export function Group_doInitialPcbPostRoutingHookRender(
  group: Group<any>,
): void {
  const hook = (group._parsedProps as SubcircuitGroupProps).pcbPostRoutingHook
  if (!hook || !group.isSubcircuit || !group.root) return
  if (group.root.pcbDisabled || group._isInflatedFromCircuitJson) return
  // never show user code a half-routed board; routing completion re-runs this phase
  if (group._isPcbRoutingPending()) return

  const result = hook(createContext(group))
  if (!(result instanceof Promise)) return
  group._queueAsyncEffect("pcb-post-routing-hook", async () => {
    await result
  })
}
