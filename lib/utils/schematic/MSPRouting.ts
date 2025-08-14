/**
 * MSP (Minimum Spanning Pathfinding) Routing for Subcircuits
 *
 * This module coordinates trace routing at the subcircuit level to eliminate duplicate
 * hub detection and create optimal minimum spanning trees for component connections.
 *
 * Key Features:
 * - Detects hub patterns (multiple components connecting to same target)
 * - Creates coordinated MSP trace chains (R4→R3→R2→R1 instead of R4→R1, R3→R1, R2→R1)
 * - Runs once per subcircuit instead of once per component
 */

import type { Group } from "../../components/primitive-components/Group/Group"
import { Trace } from "../../components/primitive-components/Trace/Trace"
import type { PrimitiveComponent } from "../../components/base-components/PrimitiveComponent"

// Type for components that can be MSP routed (returned by selectAll)
type MSPRoutableComponent = PrimitiveComponent<any>

/**
 * Hub pattern represents multiple components connecting to the same target
 */
export interface HubPattern {
  hubTarget: string
  hubPosition: { x: number; y: number }
  components: Array<{
    name: string
    component: MSPRoutableComponent
    position: { x: number; y: number }
    distanceToHub: number
    pinName: string
  }>
}

/**
 * Main MSP routing coordinator for subcircuits
 */
export class MSPRoutingCoordinator {
  private subcircuit: Group<any>

  constructor(subcircuit: Group<any>) {
    this.subcircuit = subcircuit
  }

  /**
   * Execute MSP routing coordination for the subcircuit
   */
  public coordinateMSPRouting(): void {
    if (this.subcircuit.root?.schematicDisabled) return
    if (!this.subcircuit.isSubcircuit) return

    const hubPatterns = this.detectHubPatterns()

    for (const hubPattern of hubPatterns) {
      this.createMSPTracesForHub(hubPattern)
    }
  }

  /**
   * Detect hub patterns in this subcircuit where multiple components connect to the same target
   */
  private detectHubPatterns(): HubPattern[] {
    // Use individual selectors to avoid CSS parser issues with combined selectors
    const allComponents: MSPRoutableComponent[] = []
    
    const selectors = ["resistor", "capacitor", "inductor", "chip"]
    for (const selector of selectors) {
      try {
        const found = this.subcircuit.selectAll(selector)
        allComponents.push(...found)
      } catch (selectorError) {
        // Skip failed selectors silently - some component types may not exist in this circuit
      }
    }
    const hubMap = new Map<
      string,
      Array<{
        name: string
        component: MSPRoutableComponent
        position: { x: number; y: number }
        pinName: string
      }>
    >()

    // Group components by their connection targets
    for (const component of allComponents) {
      try {
        const componentProps = component._parsedProps
        if (componentProps?.connections) {
          for (const [compPinName, compTarget] of Object.entries(
            componentProps.connections,
          )) {
            // Handle string targets (existing logic)
            if (typeof compTarget === "string" && compTarget.includes(".")) {
              const targetKey = compTarget
              if (!hubMap.has(targetKey)) {
                hubMap.set(targetKey, [])
              }

              const position =
                component._getGlobalSchematicPositionBeforeLayout()
              hubMap.get(targetKey)!.push({
                name: componentProps.name,
                component,
                position,
                pinName: compPinName,
              })
            }
            // Handle array targets - create MSP chains between component targets
            else if (Array.isArray(compTarget)) {
              // Filter to only component.pin targets (not net.* targets)
              const componentTargets = compTarget.filter(
                (target: any) =>
                  typeof target === "string" &&
                  target.includes(".") &&
                  !target.startsWith("net."),
              )

              if (componentTargets.length >= 2) {
                // Use the source pin as the hub target for MSP chaining
                const hubTargetKey = `${componentProps.name}.${compPinName}`

                // Add each target component as if it were connecting to this hub
                for (const target of componentTargets) {
                  const targetComponent = this.findComponentBySelector(target)
                  if (targetComponent) {
                    if (!hubMap.has(hubTargetKey)) {
                      hubMap.set(hubTargetKey, [])
                    }

                    const targetPosition =
                      targetComponent._getGlobalSchematicPositionBeforeLayout()
                    const targetPinName = target.split(".")[1]

                    hubMap.get(hubTargetKey)!.push({
                      name: target.split(".")[0],
                      component: targetComponent,
                      position: targetPosition,
                      pinName: targetPinName,
                    })
                  }
                }
                // Mark the chip to prevent it from creating individual traces for this pin
                ;(component as any)._mspRoutedPins =
                  (component as any)._mspRoutedPins || new Set()
                ;(component as any)._mspRoutedPins.add(compPinName)
              }
            }
          }
        }
      } catch (error) {}
    }

    // Filter to only hub patterns (2+ components connecting to same target)
    const hubPatterns: HubPattern[] = []

    for (const [hubTarget, components] of hubMap.entries()) {
      if (components.length >= 2) {
        // Find the hub position (target component position)
        let hubPosition: { x: number; y: number } | null = null

        // For virtual hubs (chip pin arrays), use the chip's position
        if (hubTarget.includes(".") && hubTarget.split(".").length === 2) {
          hubPosition = this.getComponentPosition(hubTarget)
        } else {
          // For regular hub targets, use the target component position
          hubPosition = this.getComponentPosition(hubTarget)
        }

        if (!hubPosition) continue

        // Calculate distances and sort by distance to hub
        const componentsWithDistances = components
          .map((comp) => ({
            ...comp,
            distanceToHub: Math.sqrt(
              (comp.position.x - hubPosition.x) ** 2 +
                (comp.position.y - hubPosition.y) ** 2,
            ),
          }))
          .sort((a, b) => a.distanceToHub - b.distanceToHub)

        hubPatterns.push({
          hubTarget,
          hubPosition,
          components: componentsWithDistances,
        })
      }
    }

    return hubPatterns
  }

  /**
   * Create MSP traces for a hub pattern
   * The closest component connects directly to hub, others form a chain
   */
  private createMSPTracesForHub(hubPattern: HubPattern): void {
    const { hubTarget, hubPosition, components } = hubPattern

    // Check if this is a virtual hub (chip pin array connection)
    const isVirtualHub =
      hubTarget.includes(".") && hubTarget.split(".").length === 2

    // Skip the closest component (index 0) - it connects directly to the hub
    // Create chain connections for the rest: each connects to the previous in the sorted order
    for (let i = 1; i < components.length; i++) {
      const currentComponent = components[i]
      const previousComponent = components[i - 1]

      // Create the MSP trace between components
      const trace = this.createMSPTrace(
        currentComponent,
        previousComponent,
        hubPosition,
      )

      // Mark the component so it doesn't create its own trace
      ;(currentComponent.component as any)._mspRouted = true
    }

    // For virtual hubs (chip array connections), create connection from closest component to chip
    if (isVirtualHub && components.length > 0) {
      const closestComponent = components[0]

      // Create trace from closest component to chip pin
      const chipTrace = new Trace({
        from: `${closestComponent.name}.${closestComponent.pinName}`,
        to: hubTarget,
      })
      this.subcircuit.add(chipTrace)

      // Mark closest component to prevent its normal trace creation
      ;(closestComponent.component as any)._mspRouted = true
    } else if (components.length > 0) {
      // For regular hubs, allow closest component normal routing to hub
      ;(components[0].component as any)._mspRouted = false
    }
  }

  /**
   * Create an MSP trace between two components in the chain
   */
  private createMSPTrace(
    fromComponent: HubPattern["components"][0],
    toComponent: HubPattern["components"][0],
    hubPosition: { x: number; y: number },
  ): Trace {
    const fromSelector = `${fromComponent.name}.${fromComponent.pinName}`
    const toSelector = `${toComponent.name}.${toComponent.pinName}`

    // Calculate alignment Y based on hub position for consistent routing
    const alignmentY = hubPosition.y - 1.25

    const trace = new Trace({
      from: fromSelector,
      to: toSelector,
      schematicRouteHints: [{ x: toComponent.position.x, y: alignmentY }],
    })

    // Add the trace to the subcircuit
    this.subcircuit.add(trace)

    return trace
  }

  /**
   * Find component by selector (e.g., "R1.pin1" → R1 component)
   */
  private findComponentBySelector(
    selector: string,
  ): MSPRoutableComponent | null {
    try {
      const parts = selector.split(".")
      if (parts.length !== 2) return null

      const [componentName, pinName] = parts
      const component = this.subcircuit.selectOne(componentName)
      if (!component) {
        // Try different selector formats
        const altComponent = this.subcircuit.selectOne(`.${componentName}`)
        return altComponent || null
      }

      return component
    } catch (error) {
      return null
    }
  }

  /**
   * Get component position by selector (e.g., "R1.pin1" → R1's position)
   */
  private getComponentPosition(
    selector: string,
  ): { x: number; y: number } | null {
    const component = this.findComponentBySelector(selector)
    if (!component) return null

    try {
      return component._getGlobalSchematicPositionBeforeLayout()
    } catch (error) {
      return null
    }
  }
}

/**
 * Utility function to coordinate MSP routing for a subcircuit
 */
export function coordinateSubcircuitMSPRouting(subcircuit: Group<any>): void {
  const coordinator = new MSPRoutingCoordinator(subcircuit)
  coordinator.coordinateMSPRouting()
}
