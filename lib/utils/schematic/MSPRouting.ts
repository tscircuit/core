/**
 * MSP (Minimum Spanning Pathfinding) Routing for Subcircuits
 * 
 * This module coordinates trace routing at the subcircuit level to eliminate duplicate
 * hub detection and create optimal minimum spanning trees for component connections.
 * 
 * Key Features:
 * - Detects hub patterns (multiple components connecting to same target)
 * - Creates coordinated MSP trace chains (R4→R3→R2→R1 instead of R4→R1, R3→R1, R2→R1)
 * - Visual debugging support with colored traces
 * - Runs once per subcircuit instead of once per component
 */

import type { Group } from "../../components/primitive-components/Group/Group"
import { Trace } from "../../components/primitive-components/Trace/Trace"

/**
 * Hub pattern represents multiple components connecting to the same target
 */
export interface HubPattern {
  hubTarget: string
  hubPosition: { x: number, y: number }
  components: Array<{
    name: string
    component: any
    position: { x: number, y: number }
    distanceToHub: number
    pinName: string
  }>
}

/**
 * Debug colors and styles for visual trace identification
 */
const MSP_DEBUG_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00', '#00ffff']
const MSP_DEBUG_STYLES = ['dashed', 'dashed', 'dashed', 'dotted', 'solid', 'dashed']

/**
 * Main MSP routing coordinator for subcircuits
 */
export class MSPRoutingCoordinator {
  private subcircuit: Group

  constructor(subcircuit: Group) {
    this.subcircuit = subcircuit
  }

  /**
   * Execute MSP routing coordination for the subcircuit
   */
  public coordinateMSPRouting(): void {
    if (this.subcircuit.root?.schematicDisabled) return
    if (!this.subcircuit.isSubcircuit) return
    
    console.log(`🏭 ${this.subcircuit.getString()} starting MSP routing coordination`)
    
    const hubPatterns = this.detectHubPatterns()
    
    for (const hubPattern of hubPatterns) {
      this.createMSPTracesForHub(hubPattern)
    }
    
    console.log(`🏭 ${this.subcircuit.getString()} completed MSP routing for ${hubPatterns.length} hub patterns`)
  }

  /**
   * Detect hub patterns in this subcircuit where multiple components connect to the same target
   */
  private detectHubPatterns(): HubPattern[] {
    const allComponents = this.subcircuit.selectAll('resistor, capacitor, inductor')
    const hubMap = new Map<string, Array<{
      name: string
      component: any
      position: { x: number, y: number }
      pinName: string
    }>>()
    
    console.log(`🔍 ${this.subcircuit.getString()} scanning ${allComponents.length} components for hub patterns...`)
    
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
        console.warn(`⚠️  Error processing component ${component.getString()}:`, error)
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
            Math.pow(comp.position.x - hubPosition.x, 2) + 
            Math.pow(comp.position.y - hubPosition.y, 2)
          )
        })).sort((a, b) => a.distanceToHub - b.distanceToHub)
        
        hubPatterns.push({
          hubTarget,
          hubPosition,
          components: componentsWithDistances
        })
        
        console.log(`🎯 Found hub pattern: ${componentsWithDistances.length} components → ${hubTarget}`)
        componentsWithDistances.forEach((comp, i) => {
          console.log(`   ${i}: ${comp.name} at (${comp.position.x}, ${comp.position.y}), distance: ${comp.distanceToHub.toFixed(3)}`)
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
    
    console.log(`🔗 Creating MSP traces for hub ${hubTarget} with ${components.length} components`)
    
    // Skip the closest component (index 0) - it connects directly to the hub
    // Create chain connections for the rest: each connects to the previous in the sorted order
    for (let i = 1; i < components.length; i++) {
      const currentComponent = components[i]
      const previousComponent = components[i - 1]
      
      const debugColor = this.getMSPDebugColor(i)
      const debugStyle = this.getMSPDebugStyle(i)
      
      console.log(`🔗 ${currentComponent.name} (chain pos ${i}) → ${previousComponent.name} (chain pos ${i-1})`)
      console.log(`🎨 ${currentComponent.name} debug trace style: color=${debugColor}, style=${debugStyle}`)
      
      // Create the MSP trace
      const trace = this.createMSPTrace(
        currentComponent,
        previousComponent,
        hubPosition,
        i,
        debugColor,
        debugStyle
      )
      
      // Mark the component so it doesn't create its own trace
      currentComponent.component._mspRouted = true
      
      console.log(`✅ ${currentComponent.name} generated hub MSP trace to ${previousComponent.name}!`)
    }
    
    // Mark the closest component (it will use normal routing to the hub)
    if (components.length > 0) {
      components[0].component._mspRouted = false // Allow normal routing to hub
      console.log(`❌ ${components[0].name} uses normal routing (closest to hub)`)
    }
  }

  /**
   * Create an MSP trace between two components in the chain
   */
  private createMSPTrace(
    fromComponent: any,
    toComponent: any,
    hubPosition: { x: number, y: number },
    chainIndex: number,
    debugColor: string,
    debugStyle: string
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
    
    // Set debug properties directly on the trace instance for visual debugging
    trace._debugColor = debugColor
    trace._debugLineStyle = debugStyle
    trace._debugWidthMultiplier = 1 + chainIndex * 0.3
    trace._debugTransparency = 0.8 + chainIndex * 0.05
    
    // Add the trace to the subcircuit
    this.subcircuit.add(trace)
    
    return trace
  }

  /**
   * Get debug color for MSP trace based on chain index
   */
  private getMSPDebugColor(index: number): string {
    return MSP_DEBUG_COLORS[index % MSP_DEBUG_COLORS.length]
  }

  /**
   * Get debug line style for MSP trace based on chain index  
   */
  private getMSPDebugStyle(index: number): string {
    return MSP_DEBUG_STYLES[index % MSP_DEBUG_STYLES.length]
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
        console.warn(`⚠️  Component not found: ${componentName} from selector ${selector}`)
        return null
      }
      
      return component._getGlobalSchematicPositionBeforeLayout()
    } catch (error) {
      console.warn(`⚠️  Error getting position for ${selector}:`, error)
      return null
    }
  }
}

/**
 * Utility function to coordinate MSP routing for a subcircuit
 */
export function coordinateSubcircuitMSPRouting(subcircuit: Group): void {
  const coordinator = new MSPRoutingCoordinator(subcircuit)
  coordinator.coordinateMSPRouting()
}