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
import type { NormalComponent } from "../../components/base-components/NormalComponent/NormalComponent"

// Type for components that can be MSP routed
type MSPRoutableComponent = any // TODO: Improve when component types are more specific

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
    const allComponents = this.subcircuit.selectAll('resistor, capacitor, inductor')
    const hubMap = new Map<string, Array<{
      name: string
      component: MSPRoutableComponent
      position: { x: number; y: number }
      pinName: string
    }>>()
    
    
    // Group components by their connection targets
    for (const component of allComponents) {
      try {
        const componentProps = component._parsedProps
        if (componentProps?.connections) {
          for (const [compPinName, compTarget] of Object.entries(componentProps.connections)) {
            if (typeof compTarget === 'string' && compTarget.includes('.')) {
              const targetKey = compTarget
              if (!hubMap.has(targetKey)) {
                hubMap.set(targetKey, [])
              }
              
              const position = component._getGlobalSchematicPositionBeforeLayout()
              hubMap.get(targetKey)!.push({
                name: componentProps.name,
                component,
                position,
                pinName: compPinName
              })
            }
          }
        }
      } catch (error) {
      }
    }
    
    // Filter to only hub patterns (2+ components connecting to same target)
    const hubPatterns: HubPattern[] = []
    
    for (const [hubTarget, components] of hubMap.entries()) {
      if (components.length >= 2) {
        // Find the hub position (target component position)
        const hubPosition = this.getComponentPosition(hubTarget)
        if (!hubPosition) continue
        
        // Calculate distances and sort by distance to hub
        const componentsWithDistances = components.map(comp => ({
          ...comp,
          distanceToHub: Math.sqrt(
            (comp.position.x - hubPosition.x) ** 2 + 
            (comp.position.y - hubPosition.y) ** 2
          )
        })).sort((a, b) => a.distanceToHub - b.distanceToHub)
        
        hubPatterns.push({
          hubTarget,
          hubPosition,
          components: componentsWithDistances
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
    
    
    // Skip the closest component (index 0) - it connects directly to the hub
    // Create chain connections for the rest: each connects to the previous in the sorted order
    for (let i = 1; i < components.length; i++) {
      const currentComponent = components[i]
      const previousComponent = components[i - 1]
      
      // Create the MSP trace
      const trace = this.createMSPTrace(
        currentComponent,
        previousComponent,
        hubPosition
      )
      
      // Mark the component so it doesn't create its own trace
      ;(currentComponent.component as any)._mspRouted = true
      
    }
    
    // Mark the closest component (it will use normal routing to the hub)
    if (components.length > 0) {
      ;(components[0].component as any)._mspRouted = false // Allow normal routing to hub
    }
  }

  /**
   * Create an MSP trace between two components in the chain
   */
  private createMSPTrace(
    fromComponent: HubPattern['components'][0],
    toComponent: HubPattern['components'][0],
    hubPosition: { x: number; y: number }
  ): Trace {
    const fromSelector = `${fromComponent.name}.${fromComponent.pinName}`
    const toSelector = `${toComponent.name}.${fromComponent.pinName}`
    
    // Calculate alignment Y based on hub position for consistent routing
    const alignmentY = hubPosition.y - 1.25
    
    const trace = new Trace({
      from: fromSelector,
      to: toSelector,
      schematicRouteHints: [
        { x: toComponent.position.x, y: alignmentY }
      ]
    })
    
    
    // Add the trace to the subcircuit
    this.subcircuit.add(trace)
    
    return trace
  }


  /**
   * Get component position by selector (e.g., "R1.pin1" → R1's position)
   */
  private getComponentPosition(selector: string): { x: number, y: number } | null {
    try {
      const parts = selector.split('.')
      if (parts.length !== 2) return null
      
      const [componentName, pinName] = parts
      const component = this.subcircuit.selectOne(componentName)
      if (!component) {
        // Try different selector formats
        const altComponent = this.subcircuit.selectOne(`.${componentName}`)
        if (altComponent) {
          return altComponent._getGlobalSchematicPositionBeforeLayout()
        }
        return null
      }
      
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