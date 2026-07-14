import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent/PrimitiveComponent"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import type { Port } from "./Port"

type PortSelectorSubcircuit = Pick<ISubcircuit, "selectOne">

const isPort = (portCandidate: PrimitiveComponent): portCandidate is Port =>
  portCandidate.componentName === "Port"

/**
 * Resolves a port selector using the same explicit and single-port shorthand
 * forms accepted by trace endpoints.
 */
export const resolvePortSelector = (
  subcircuit: PortSelectorSubcircuit,
  portSelector: string,
): Port | null => {
  const selectedPort = subcircuit.selectOne<Port>(portSelector, {
    type: "port",
  })
  if (selectedPort) return selectedPort

  const hasExplicitPortToken =
    portSelector.lastIndexOf(".") > portSelector.lastIndexOf(" ")
  if (hasExplicitPortToken) return null

  let selectedPortOwner = subcircuit.selectOne(portSelector)
  if (!selectedPortOwner && !/[.#\[]/.test(portSelector)) {
    selectedPortOwner = subcircuit.selectOne(`.${portSelector}`)
  }
  if (!selectedPortOwner) return null

  const selectedPortOwnerPorts = selectedPortOwner.children.filter(isPort)
  return selectedPortOwnerPorts.length === 1 ? selectedPortOwnerPorts[0] : null
}
