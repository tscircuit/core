import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Port } from "lib/components/primitive-components/Port/Port"

/**
 * Resolve a selector to a Port within the provided component scope.
 * The lookup mirrors the behaviour used when wiring traces from selectors,
 * allowing reuse wherever we need to parse connection props.
 */
export const resolvePortFromSelector = (
  scope: PrimitiveComponent,
  selector: string,
): Port | null => {
  const normalized = selector.trim()
  if (!normalized) return null

  const direct = scope.selectOne(normalized, { type: "port" }) as Port | null
  if (direct) return direct

  const dotIndex = normalized.lastIndexOf(".")
  if (dotIndex === -1) return null

  const parentSelector = normalized.slice(0, dotIndex)
  const portToken = normalized.slice(dotIndex + 1)

  let parentComponent = scope.selectOne(
    parentSelector,
  ) as PrimitiveComponent | null
  if (!parentComponent && parentSelector && !/[.#\[]/.test(parentSelector)) {
    parentComponent = scope.selectOne(
      `.${parentSelector}`,
    ) as PrimitiveComponent | null
  }
  if (!parentComponent) return null

  // Try the component's custom selectOne method first
  // This handles cases like Groups that implement custom port resolution
  const customResolved = parentComponent.selectOne(`.${portToken}`, {
    port: true,
  })
  if (customResolved && customResolved.componentName === "Port") {
    return customResolved as Port
  }

  // Fall back to direct children search for normal components
  const ports = parentComponent.children.filter(
    (child) => child.componentName === "Port",
  ) as Port[]

  return (
    ports.find((port) => port.getNameAndAliases().includes(portToken)) ?? null
  )
}
