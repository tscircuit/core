import { selectAll, type Options } from "css-select"
import type { AnyCircuitElement } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { cssSelectPrimitiveComponentAdapter } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import type { AssemblyDrawingDimension } from "lib/components/primitive-components/AssemblyDrawingDimension"
import type { AssemblyDrawingPartView } from "lib/components/primitive-components/AssemblyDrawingPartView"
import { getAssemblyScope } from "lib/components/primitive-components/get-assembly-scope-components"
import {
  getDrawingModelFeatures,
  type DrawingModelFeature,
} from "../geometry/get-drawing-model-features"

interface DrawingSelectorNode {
  part?: PrimitiveComponent
  feature?: DrawingModelFeature
  parent: DrawingSelectorNode | null
  children: DrawingSelectorNode[]
}

/** Build a read-only selector tree. Model features are virtual children of their
 * owning part, scoped to the geometry selected by this view; no props are changed.
 */
export async function resolveDrawingEdgeReferences(
  view: AssemblyDrawingPartView,
  dimensions: AssemblyDrawingDimension[],
  selected: AnyCircuitElement[],
) {
  const resolved = new Map<AssemblyDrawingDimension, DrawingModelFeature>()
  if (!dimensions.some((dimension) => dimension._parsedProps.edgeRef))
    return resolved
  const features = await getDrawingModelFeatures(selected)
  const build = (
    part: PrimitiveComponent,
    parent: DrawingSelectorNode | null,
  ): DrawingSelectorNode => {
    const node: DrawingSelectorNode = { part, parent, children: [] }
    node.children = [
      ...part.children.map((child) => build(child, node)),
      ...features
        .filter(
          (feature) => feature.sourceComponentId === part.source_component_id,
        )
        .map((feature) => ({ feature, parent: node, children: [] })),
    ]
    return node
  }
  const root = build(getAssemblyScope(view), null)
  const descendants = (nodes: DrawingSelectorNode[]): DrawingSelectorNode[] =>
    nodes.flatMap((node) => [node, ...descendants(node.children)])
  const attribute = (node: DrawingSelectorNode, name: string) =>
    node.part
      ? cssSelectPrimitiveComponentAdapter!.getAttributeValue(node.part, name)
      : name === "class" || name === "name"
        ? node.feature!.name
        : undefined
  const adapter: Options<DrawingSelectorNode, DrawingSelectorNode>["adapter"] =
    {
      isTag: (node): node is DrawingSelectorNode => true,
      getParent: (node) => node.parent,
      getChildren: (node) => node.children,
      getName: (node) => node.part?.lowercaseComponentName ?? "edge",
      getAttributeValue: attribute,
      hasAttrib: (node, name) => attribute(node, name) != null,
      getSiblings: (node) => node.parent?.children ?? [node],
      getText: () => "",
      removeSubsets: (nodes) =>
        nodes.filter(
          (node) =>
            !nodes.some(
              (other) =>
                other !== node && descendants(other.children).includes(node),
            ),
        ),
      existsOne: (test, nodes) => descendants(nodes).some(test),
      findAll: (test, nodes) => descendants(nodes).filter(test),
      findOne: (test, nodes) => descendants(nodes).find(test) ?? null,
      equals: (a, b) => a === b,
    }
  for (const dimension of dimensions) {
    const selector = dimension._parsedProps.edgeRef
    if (!selector) continue
    const matches = selectAll(preprocessSelector(selector, view), [root], {
      adapter,
    }).flatMap((node) => (node.feature ? [node.feature] : []))
    if (matches.length !== 1)
      throw new Error(
        `Dimension edgeRef "${selector}" in part view "${view.name || "unnamed part view"}" matched ${matches.length} named model features in the selected geometry; expected exactly one`,
      )
    resolved.set(dimension, matches[0]!)
  }
  return resolved
}
