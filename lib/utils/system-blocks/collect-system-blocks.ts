import type {
  SystemBlockComponentProps,
  SystemBlockConnectionProps,
} from "@tscircuit/props"
import { SystemBlockComponent } from "lib/components/primitive-components/SystemBlockComponent"
import { SystemBlockGroup } from "lib/components/primitive-components/SystemBlockGroup"
import { SystemBlockConnection } from "lib/components/primitive-components/SystemBlockConnection"
import type { SystemBlockPage } from "lib/components/primitive-components/SystemBlockPage/SystemBlockPage"

export type SystemBlockName = SystemBlockComponentProps["name"]
type SystemConnectionName = SystemBlockConnectionProps["name"]

export function collectSystemBlocks(page: SystemBlockPage) {
  const groups: SystemBlockGroup[] = []
  const components: SystemBlockComponent[] = []
  const connections: SystemBlockConnection[] = []
  const blocksByName = new Map<
    SystemBlockName,
    SystemBlockComponent | SystemBlockGroup
  >()
  const connectionNames = new Set<SystemConnectionName>()
  const parents = new Map<
    SystemBlockComponent | SystemBlockGroup,
    SystemBlockGroup
  >()
  const visit = (container: SystemBlockPage | SystemBlockGroup) => {
    for (const child of container.children) {
      if (child.shouldBeRemoved) continue
      child.config.zodProps.parse(child.props)
      if (child instanceof SystemBlockConnection) {
        const { name } = child._parsedProps
        if (name && connectionNames.has(name))
          throw new Error(
            `Duplicate system connection name "${name}" on page "${page.name}"`,
          )
        if (name) connectionNames.add(name)
        connections.push(child)
        continue
      }
      if (
        !(child instanceof SystemBlockComponent) &&
        !(child instanceof SystemBlockGroup)
      )
        throw new Error(
          `System page "${page.name}" can contain only system blocks, groups, and connections`,
        )
      const { name } = child._parsedProps
      if (blocksByName.has(name))
        throw new Error(
          `Duplicate system block name "${name}" on page "${page.name}"`,
        )
      blocksByName.set(name, child)
      if (container instanceof SystemBlockGroup) parents.set(child, container)
      if (child instanceof SystemBlockGroup) {
        groups.push(child)
        visit(child)
      } else components.push(child)
    }
  }
  visit(page)
  const endpoints = new Map<
    SystemBlockConnection,
    { from: SystemBlockComponent; to: SystemBlockComponent }
  >()
  for (const connection of connections) {
    const { from, to } = connection._parsedProps
    const source = blocksByName.get(from)
    const target = blocksByName.get(to)
    if (!(source instanceof SystemBlockComponent))
      throw new Error(
        `System connection endpoint "${from}" must name a component on page "${page.name}"`,
      )
    if (!(target instanceof SystemBlockComponent))
      throw new Error(
        `System connection endpoint "${to}" must name a component on page "${page.name}"`,
      )
    endpoints.set(connection, { from: source, to: target })
  }
  return { groups, components, connections, parents, endpoints }
}

export type SystemBlockTree = ReturnType<typeof collectSystemBlocks>
