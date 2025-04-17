import { test, expect } from "bun:test"
import { PrimitiveComponent, RootCircuit } from "lib"
import { selectOne } from "css-select"

// class SubcircuitSelectorIndex {
//   private index: Map<string, PrimitiveComponent> = new Map()

//   constructor() {}

//   register(component: PrimitiveComponent) {}
// }

/**
 * CSS-Select adapter for PrimitiveComponent
 * This adapter allows css-select to work with our PrimitiveComponent tree structure
 */
const primitiveComponentAdapter = {
  // Is the node an element?
  isTag: (node: PrimitiveComponent) => true,

  // Get the parent of the node
  getParent: (node: PrimitiveComponent) => node.parent,

  // Get the children of the node
  getChildren: (node: PrimitiveComponent) => node.children,

  // Get the name of the tag
  getName: (node: PrimitiveComponent) => node.lowercaseComponentName,

  // Get the attribute value
  getAttributeValue: (node: PrimitiveComponent, name: string) => {
    if (name === "name" && node._parsedProps?.name) {
      return node._parsedProps.name
    }
    if (name in node._parsedProps) {
      return node._parsedProps[name]
    }
    return null
  },

  // Check if a node has an attribute
  hasAttrib: (node: PrimitiveComponent, name: string) => {
    return name in node._parsedProps
  },

  // Get a list of attribute names
  getAttributeNames: (node: PrimitiveComponent) => {
    return Object.keys(node._parsedProps || {})
  },

  // Get the siblings of the node
  getSiblings: (node: PrimitiveComponent) => {
    if (!node.parent) return []
    return node.parent.children
  },

  // Get the next sibling
  nextElementSibling: (node: PrimitiveComponent) => {
    if (!node.parent) return null
    const siblings = node.parent.children
    const idx = siblings.indexOf(node)
    return idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null
  },

  // Get the previous sibling
  prevElementSibling: (node: PrimitiveComponent) => {
    if (!node.parent) return null
    const siblings = node.parent.children
    const idx = siblings.indexOf(node)
    return idx > 0 ? siblings[idx - 1] : null
  },

  // Get the text content
  getText: () => "",

  // Get the text content of the node and its children
  getInnerHTML: () => "",

  // Get the HTML of the node's children
  getOuterHTML: (node: PrimitiveComponent) => node.getString(),

  // Remove the node
  removeSubsets: (nodes: PrimitiveComponent[]) => {
    return nodes.filter(
      (node, i) =>
        !nodes.some(
          (other, j) =>
            i !== j && other !== node && other.getDescendants().includes(node),
        ),
    )
  },

  // Determine if element a is a subset of element b
  existsOne: (
    test: (node: PrimitiveComponent) => boolean,
    nodes: PrimitiveComponent[],
  ) => {
    return nodes.some(test)
  },

  // Find all elements matching a selector
  findAll: (
    test: (node: PrimitiveComponent) => boolean,
    nodes: PrimitiveComponent[],
  ) => {
    const result: PrimitiveComponent[] = []

    const recurse = (node: PrimitiveComponent) => {
      if (test(node)) {
        result.push(node)
      }

      for (const child of node.children) {
        recurse(child)
      }
    }

    for (const node of nodes) {
      recurse(node)
    }

    return result
  },

  // Find one element matching a selector
  findOne: (
    test: (node: PrimitiveComponent) => boolean,
    nodes: PrimitiveComponent[],
  ) => {
    for (const node of nodes) {
      if (test(node)) return node

      const children = node.children
      if (children.length > 0) {
        const result = primitiveComponentAdapter.findOne(test, children)
        if (result) return result
      }
    }

    return null
  },

  // Get the ID attribute
  getElementById: (id: string, nodes: PrimitiveComponent[]) => {
    return primitiveComponentAdapter.findOne(
      (node) => node._renderId === id,
      nodes,
    )
  },
}

test("selector-index1", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  expect(circuit.children).toMatchInlineSnapshot(`
    [
      <board#15 /> Board {
        "__tsci": {},
        "_asyncAutoroutingResult": null,
        "_asyncEffects": [],
        "_asyncSupplierPartNumbers": undefined,
        "_currentRenderPhase": "PartsEngineRender",
        "_drcChecksComplete": false,
        "_hasStartedAsyncAutorouting": false,
        "_impliedFootprint": undefined,
        "_parsedProps": {
          "children": {
            "$$typeof": Symbol(react.transitional.element),
            "_debugInfo": null,
            "_owner": null,
            "_store": {
              "validated": 1,
            },
            "key": null,
            "props": {
              "footprint": "0402",
              "name": "R1",
              "resistance": "10k",
            },
            "ref": null,
            "type": "resistor",
          },
          "height": 10,
          "material": "fr4",
          "width": 10,
        },
        "_renderId": "15",
        "cad_component_id": null,
        "children": [
          <resistor#0 name=".R1" /> Resistor {
            "__tsci": {},
            "_asyncEffects": [],
            "_asyncSupplierPartNumbers": undefined,
            "_currentRenderPhase": "PartsEngineRender",
            "_impliedFootprint": undefined,
            "_parsedProps": {
              "footprint": "0402",
              "name": "R1",
              "resistance": 10000,
            },
            "_renderId": "0",
            "cad_component_id": null,
            "children": [
              <smtpad#1(.1, .left) /> SmtPad {
                "_asyncEffects": [],
                "_currentRenderPhase": "PartsEngineRender",
                "_parsedProps": {
                  "height": 0.6000000000000001,
                  "layer": "top",
                  "pcbX": -0.5,
                  "pcbY": 0,
                  "portHints": [
                    "1",
                    "left",
                  ],
                  "shape": "rect",
                  "width": 0.6000000000000001,
                },
                "_renderId": "1",
                "cad_component_id": null,
                "children": [],
                "childrenPendingRemoval": [],
                "externallyAddedAliases": [],
                "isPcbPrimitive": true,
                "isPrimitiveContainer": false,
                "isSchematicPrimitive": false,
                "matchedPort": <port#5(pin:1 .R1>.pin1) /> Port {
                  "_asyncEffects": [],
                  "_currentRenderPhase": "PartsEngineRender",
                  "_parsedProps": {
                    "aliases": [
                      "anode",
                      "pos",
                      "left",
                    ],
                    "name": "pin1",
                    "pinNumber": 1,
                  },
                  "_renderId": "5",
                  "cad_component_id": null,
                  "children": [],
                  "childrenPendingRemoval": [],
                  "externallyAddedAliases": [],
                  "facingDirection": "left",
                  "isPcbPrimitive": false,
                  "isPrimitiveContainer": false,
                  "isSchematicPrimitive": false,
                  "matchedComponents": [
                    [Circular],
                  ],
                  "originDescription": "schematicSymbol:labels[0]:1",
                  "parent": [Circular],
                  "pcb_component_id": null,
                  "pcb_port_id": "pcb_port_0",
                  "props": {
                    "aliases": [
                      "anode",
                      "pos",
                      "left",
                    ],
                    "name": "pin1",
                    "pinNumber": 1,
                  },
                  "renderPhaseStates": {
                    "CadModelRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "CreateNetsFromProps": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "CreateTraceHintsFromProps": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "CreateTracesFromProps": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "InitializePortsFromChildren": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PartsEngineRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbBoardAutoSize": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbComponentRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbComponentSizeCalculation": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbDesignRuleChecks": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbFootprintLayout": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbLayout": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbPortAttachment": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbPortRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbPrimitiveRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbRouteNetIslands": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbTraceHintRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbTraceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PortMatching": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "ReactSubtreesRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicComponentRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicLayout": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicPortRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicTraceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceAddConnectivityMapKey": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceParentAttachment": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceTraceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                  },
                  "schematicSymbolPortDef": {
                    "labels": [
                      "1",
                    ],
                    "x": -0.5337907000000002,
                    "y": 0.04580520000000021,
                  },
                  "schematic_component_id": null,
                  "schematic_port_id": "schematic_port_0",
                  "shouldBeRemoved": false,
                  "source_component_id": "source_component_0",
                  "source_group_id": null,
                  "source_port_id": "source_port_0",
                },
                "parent": [Circular],
                "pcb_component_id": null,
                "pcb_smtpad_id": "pcb_smtpad_0",
                "props": {
                  "height": 0.6000000000000001,
                  "layer": "top",
                  "pcbX": -0.5,
                  "pcbY": 0,
                  "portHints": [
                    "1",
                    "left",
                  ],
                  "shape": "rect",
                  "width": 0.6000000000000001,
                },
                "renderPhaseStates": {
                  "CadModelRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateNetsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTraceHintsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTracesFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "InitializePortsFromChildren": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PartsEngineRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbBoardAutoSize": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentSizeCalculation": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbDesignRuleChecks": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbFootprintLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPrimitiveRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbRouteNetIslands": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceHintRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PortMatching": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "ReactSubtreesRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceAddConnectivityMapKey": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceParentAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                },
                "schematic_component_id": null,
                "shouldBeRemoved": false,
                "source_component_id": null,
                "source_group_id": null,
              },
              <smtpad#2(.2, .right) /> SmtPad {
                "_asyncEffects": [],
                "_currentRenderPhase": "PartsEngineRender",
                "_parsedProps": {
                  "height": 0.6000000000000001,
                  "layer": "top",
                  "pcbX": 0.5,
                  "pcbY": 0,
                  "portHints": [
                    "2",
                    "right",
                  ],
                  "shape": "rect",
                  "width": 0.6000000000000001,
                },
                "_renderId": "2",
                "cad_component_id": null,
                "children": [],
                "childrenPendingRemoval": [],
                "externallyAddedAliases": [],
                "isPcbPrimitive": true,
                "isPrimitiveContainer": false,
                "isSchematicPrimitive": false,
                "matchedPort": <port#6(pin:2 .R1>.pin2) /> Port {
                  "_asyncEffects": [],
                  "_currentRenderPhase": "PartsEngineRender",
                  "_parsedProps": {
                    "aliases": [
                      "cathode",
                      "neg",
                      "right",
                    ],
                    "name": "pin2",
                    "pinNumber": 2,
                  },
                  "_renderId": "6",
                  "cad_component_id": null,
                  "children": [],
                  "childrenPendingRemoval": [],
                  "externallyAddedAliases": [],
                  "facingDirection": "right",
                  "isPcbPrimitive": false,
                  "isPrimitiveContainer": false,
                  "isSchematicPrimitive": false,
                  "matchedComponents": [
                    [Circular],
                  ],
                  "originDescription": "schematicSymbol:labels[0]:2",
                  "parent": [Circular],
                  "pcb_component_id": null,
                  "pcb_port_id": "pcb_port_1",
                  "props": {
                    "aliases": [
                      "cathode",
                      "neg",
                      "right",
                    ],
                    "name": "pin2",
                    "pinNumber": 2,
                  },
                  "renderPhaseStates": {
                    "CadModelRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "CreateNetsFromProps": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "CreateTraceHintsFromProps": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "CreateTracesFromProps": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "InitializePortsFromChildren": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PartsEngineRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbBoardAutoSize": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbComponentRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbComponentSizeCalculation": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbDesignRuleChecks": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbFootprintLayout": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbLayout": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbPortAttachment": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbPortRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbPrimitiveRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbRouteNetIslands": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbTraceHintRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PcbTraceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "PortMatching": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "ReactSubtreesRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicComponentRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicLayout": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicPortRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SchematicTraceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceAddConnectivityMapKey": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceParentAttachment": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                    "SourceTraceRender": {
                      "dirty": false,
                      "initialized": true,
                    },
                  },
                  "schematicSymbolPortDef": {
                    "labels": [
                      "2",
                    ],
                    "x": 0.5337907000000004,
                    "y": 0.04525870000000154,
                  },
                  "schematic_component_id": null,
                  "schematic_port_id": "schematic_port_1",
                  "shouldBeRemoved": false,
                  "source_component_id": "source_component_0",
                  "source_group_id": null,
                  "source_port_id": "source_port_1",
                },
                "parent": [Circular],
                "pcb_component_id": null,
                "pcb_smtpad_id": "pcb_smtpad_1",
                "props": {
                  "height": 0.6000000000000001,
                  "layer": "top",
                  "pcbX": 0.5,
                  "pcbY": 0,
                  "portHints": [
                    "2",
                    "right",
                  ],
                  "shape": "rect",
                  "width": 0.6000000000000001,
                },
                "renderPhaseStates": {
                  "CadModelRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateNetsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTraceHintsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTracesFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "InitializePortsFromChildren": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PartsEngineRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbBoardAutoSize": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentSizeCalculation": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbDesignRuleChecks": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbFootprintLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPrimitiveRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbRouteNetIslands": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceHintRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PortMatching": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "ReactSubtreesRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceAddConnectivityMapKey": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceParentAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                },
                "schematic_component_id": null,
                "shouldBeRemoved": false,
                "source_component_id": null,
                "source_group_id": null,
              },
              <silkscreenpath#3 /> SilkscreenPath {
                "_asyncEffects": [],
                "_currentRenderPhase": "PartsEngineRender",
                "_parsedProps": {
                  "layer": "top",
                  "route": [
                    {
                      "x": 0.5,
                      "y": 0.7000000000000001,
                    },
                    {
                      "x": -1,
                      "y": 0.7000000000000001,
                    },
                    {
                      "x": -1,
                      "y": -0.7000000000000001,
                    },
                    {
                      "x": 0.5,
                      "y": -0.7000000000000001,
                    },
                  ],
                  "strokeWidth": 0.1,
                },
                "_renderId": "3",
                "cad_component_id": null,
                "children": [],
                "childrenPendingRemoval": [],
                "externallyAddedAliases": [],
                "isPcbPrimitive": true,
                "isPrimitiveContainer": false,
                "isSchematicPrimitive": false,
                "parent": [Circular],
                "pcb_component_id": null,
                "pcb_silkscreen_path_id": "pcb_silkscreen_path_0",
                "props": {
                  "layer": "top",
                  "route": [
                    {
                      "x": 0.5,
                      "y": 0.7000000000000001,
                    },
                    {
                      "x": -1,
                      "y": 0.7000000000000001,
                    },
                    {
                      "x": -1,
                      "y": -0.7000000000000001,
                    },
                    {
                      "x": 0.5,
                      "y": -0.7000000000000001,
                    },
                  ],
                  "strokeWidth": 0.1,
                },
                "renderPhaseStates": {
                  "CadModelRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateNetsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTraceHintsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTracesFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "InitializePortsFromChildren": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PartsEngineRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbBoardAutoSize": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentSizeCalculation": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbDesignRuleChecks": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbFootprintLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPrimitiveRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbRouteNetIslands": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceHintRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PortMatching": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "ReactSubtreesRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceAddConnectivityMapKey": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceParentAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                },
                "schematic_component_id": null,
                "shouldBeRemoved": false,
                "source_component_id": null,
                "source_group_id": null,
              },
              <silkscreentext#4 /> SilkscreenText {
                "_asyncEffects": [],
                "_currentRenderPhase": "PartsEngineRender",
                "_parsedProps": {
                  "anchorAlignment": "center",
                  "fontSize": 0.4,
                  "pcbRotation": 0,
                  "pcbX": 0,
                  "pcbY": 1.2000000000000002,
                  "text": "R1",
                },
                "_renderId": "4",
                "cad_component_id": null,
                "children": [],
                "childrenPendingRemoval": [],
                "externallyAddedAliases": [],
                "isPcbPrimitive": true,
                "isPrimitiveContainer": false,
                "isSchematicPrimitive": false,
                "parent": [Circular],
                "pcb_component_id": null,
                "props": {
                  "anchorAlignment": "center",
                  "fontSize": 0.4,
                  "pcbRotation": 0,
                  "pcbX": 0,
                  "pcbY": 1.2000000000000002,
                  "text": "R1",
                },
                "renderPhaseStates": {
                  "CadModelRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateNetsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTraceHintsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTracesFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "InitializePortsFromChildren": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PartsEngineRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbBoardAutoSize": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentSizeCalculation": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbDesignRuleChecks": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbFootprintLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPrimitiveRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbRouteNetIslands": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceHintRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PortMatching": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "ReactSubtreesRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceAddConnectivityMapKey": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceParentAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                },
                "schematic_component_id": null,
                "shouldBeRemoved": false,
                "source_component_id": null,
                "source_group_id": null,
              },
              <port#5(pin:1 .R1>.pin1) /> Port {
                "_asyncEffects": [],
                "_currentRenderPhase": "PartsEngineRender",
                "_parsedProps": {
                  "aliases": [
                    "anode",
                    "pos",
                    "left",
                  ],
                  "name": "pin1",
                  "pinNumber": 1,
                },
                "_renderId": "5",
                "cad_component_id": null,
                "children": [],
                "childrenPendingRemoval": [],
                "externallyAddedAliases": [],
                "facingDirection": "left",
                "isPcbPrimitive": false,
                "isPrimitiveContainer": false,
                "isSchematicPrimitive": false,
                "matchedComponents": [
                  <smtpad#1(.1, .left) /> SmtPad {
                    "_asyncEffects": [],
                    "_currentRenderPhase": "PartsEngineRender",
                    "_parsedProps": {
                      "height": 0.6000000000000001,
                      "layer": "top",
                      "pcbX": -0.5,
                      "pcbY": 0,
                      "portHints": [
                        "1",
                        "left",
                      ],
                      "shape": "rect",
                      "width": 0.6000000000000001,
                    },
                    "_renderId": "1",
                    "cad_component_id": null,
                    "children": [],
                    "childrenPendingRemoval": [],
                    "externallyAddedAliases": [],
                    "isPcbPrimitive": true,
                    "isPrimitiveContainer": false,
                    "isSchematicPrimitive": false,
                    "matchedPort": [Circular],
                    "parent": [Circular],
                    "pcb_component_id": null,
                    "pcb_smtpad_id": "pcb_smtpad_0",
                    "props": {
                      "height": 0.6000000000000001,
                      "layer": "top",
                      "pcbX": -0.5,
                      "pcbY": 0,
                      "portHints": [
                        "1",
                        "left",
                      ],
                      "shape": "rect",
                      "width": 0.6000000000000001,
                    },
                    "renderPhaseStates": {
                      "CadModelRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "CreateNetsFromProps": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "CreateTraceHintsFromProps": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "CreateTracesFromProps": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "InitializePortsFromChildren": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PartsEngineRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbBoardAutoSize": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbComponentRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbComponentSizeCalculation": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbDesignRuleChecks": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbFootprintLayout": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbLayout": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbPortAttachment": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbPortRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbPrimitiveRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbRouteNetIslands": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbTraceHintRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbTraceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PortMatching": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "ReactSubtreesRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicComponentRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicLayout": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicPortRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicTraceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceAddConnectivityMapKey": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceParentAttachment": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceTraceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                    },
                    "schematic_component_id": null,
                    "shouldBeRemoved": false,
                    "source_component_id": null,
                    "source_group_id": null,
                  },
                ],
                "originDescription": "schematicSymbol:labels[0]:1",
                "parent": [Circular],
                "pcb_component_id": null,
                "pcb_port_id": "pcb_port_0",
                "props": {
                  "aliases": [
                    "anode",
                    "pos",
                    "left",
                  ],
                  "name": "pin1",
                  "pinNumber": 1,
                },
                "renderPhaseStates": {
                  "CadModelRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateNetsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTraceHintsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTracesFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "InitializePortsFromChildren": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PartsEngineRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbBoardAutoSize": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentSizeCalculation": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbDesignRuleChecks": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbFootprintLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPrimitiveRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbRouteNetIslands": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceHintRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PortMatching": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "ReactSubtreesRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceAddConnectivityMapKey": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceParentAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                },
                "schematicSymbolPortDef": {
                  "labels": [
                    "1",
                  ],
                  "x": -0.5337907000000002,
                  "y": 0.04580520000000021,
                },
                "schematic_component_id": null,
                "schematic_port_id": "schematic_port_0",
                "shouldBeRemoved": false,
                "source_component_id": "source_component_0",
                "source_group_id": null,
                "source_port_id": "source_port_0",
              },
              <port#6(pin:2 .R1>.pin2) /> Port {
                "_asyncEffects": [],
                "_currentRenderPhase": "PartsEngineRender",
                "_parsedProps": {
                  "aliases": [
                    "cathode",
                    "neg",
                    "right",
                  ],
                  "name": "pin2",
                  "pinNumber": 2,
                },
                "_renderId": "6",
                "cad_component_id": null,
                "children": [],
                "childrenPendingRemoval": [],
                "externallyAddedAliases": [],
                "facingDirection": "right",
                "isPcbPrimitive": false,
                "isPrimitiveContainer": false,
                "isSchematicPrimitive": false,
                "matchedComponents": [
                  <smtpad#2(.2, .right) /> SmtPad {
                    "_asyncEffects": [],
                    "_currentRenderPhase": "PartsEngineRender",
                    "_parsedProps": {
                      "height": 0.6000000000000001,
                      "layer": "top",
                      "pcbX": 0.5,
                      "pcbY": 0,
                      "portHints": [
                        "2",
                        "right",
                      ],
                      "shape": "rect",
                      "width": 0.6000000000000001,
                    },
                    "_renderId": "2",
                    "cad_component_id": null,
                    "children": [],
                    "childrenPendingRemoval": [],
                    "externallyAddedAliases": [],
                    "isPcbPrimitive": true,
                    "isPrimitiveContainer": false,
                    "isSchematicPrimitive": false,
                    "matchedPort": [Circular],
                    "parent": [Circular],
                    "pcb_component_id": null,
                    "pcb_smtpad_id": "pcb_smtpad_1",
                    "props": {
                      "height": 0.6000000000000001,
                      "layer": "top",
                      "pcbX": 0.5,
                      "pcbY": 0,
                      "portHints": [
                        "2",
                        "right",
                      ],
                      "shape": "rect",
                      "width": 0.6000000000000001,
                    },
                    "renderPhaseStates": {
                      "CadModelRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "CreateNetsFromProps": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "CreateTraceHintsFromProps": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "CreateTracesFromProps": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "InitializePortsFromChildren": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PartsEngineRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbBoardAutoSize": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbComponentRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbComponentSizeCalculation": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbDesignRuleChecks": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbFootprintLayout": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbLayout": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbPortAttachment": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbPortRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbPrimitiveRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbRouteNetIslands": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbTraceHintRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PcbTraceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "PortMatching": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "ReactSubtreesRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicComponentRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicLayout": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicPortRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SchematicTraceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceAddConnectivityMapKey": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceParentAttachment": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                      "SourceTraceRender": {
                        "dirty": false,
                        "initialized": true,
                      },
                    },
                    "schematic_component_id": null,
                    "shouldBeRemoved": false,
                    "source_component_id": null,
                    "source_group_id": null,
                  },
                ],
                "originDescription": "schematicSymbol:labels[0]:2",
                "parent": [Circular],
                "pcb_component_id": null,
                "pcb_port_id": "pcb_port_1",
                "props": {
                  "aliases": [
                    "cathode",
                    "neg",
                    "right",
                  ],
                  "name": "pin2",
                  "pinNumber": 2,
                },
                "renderPhaseStates": {
                  "CadModelRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateNetsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTraceHintsFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "CreateTracesFromProps": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "InitializePortsFromChildren": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PartsEngineRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbBoardAutoSize": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbComponentSizeCalculation": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbDesignRuleChecks": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbFootprintLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbPrimitiveRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbRouteNetIslands": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceHintRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PcbTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "PortMatching": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "ReactSubtreesRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicComponentRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicLayout": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicPortRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SchematicTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceAddConnectivityMapKey": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceParentAttachment": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                  "SourceTraceRender": {
                    "dirty": false,
                    "initialized": true,
                  },
                },
                "schematicSymbolPortDef": {
                  "labels": [
                    "2",
                  ],
                  "x": 0.5337907000000004,
                  "y": 0.04525870000000154,
                },
                "schematic_component_id": null,
                "schematic_port_id": "schematic_port_1",
                "shouldBeRemoved": false,
                "source_component_id": "source_component_0",
                "source_group_id": null,
                "source_port_id": "source_port_1",
              },
            ],
            "childrenPendingRemoval": [],
            "externallyAddedAliases": [],
            "isPcbPrimitive": false,
            "isPrimitiveContainer": true,
            "isSchematicPrimitive": false,
            "parent": [Circular],
            "pcb_component_id": "pcb_component_0",
            "pcb_missing_footprint_error_id": undefined,
            "props": {
              "footprint": "0402",
              "name": "R1",
              "resistance": "10k",
            },
            "reactSubtrees": [],
            "renderPhaseStates": {
              "CadModelRender": {
                "dirty": false,
                "initialized": true,
              },
              "CreateNetsFromProps": {
                "dirty": false,
                "initialized": true,
              },
              "CreateTraceHintsFromProps": {
                "dirty": false,
                "initialized": true,
              },
              "CreateTracesFromProps": {
                "dirty": false,
                "initialized": true,
              },
              "InitializePortsFromChildren": {
                "dirty": false,
                "initialized": true,
              },
              "PartsEngineRender": {
                "dirty": false,
                "initialized": true,
              },
              "PcbBoardAutoSize": {
                "dirty": false,
                "initialized": true,
              },
              "PcbComponentRender": {
                "dirty": false,
                "initialized": true,
              },
              "PcbComponentSizeCalculation": {
                "dirty": false,
                "initialized": true,
              },
              "PcbDesignRuleChecks": {
                "dirty": false,
                "initialized": true,
              },
              "PcbFootprintLayout": {
                "dirty": false,
                "initialized": true,
              },
              "PcbLayout": {
                "dirty": false,
                "initialized": true,
              },
              "PcbPortAttachment": {
                "dirty": false,
                "initialized": true,
              },
              "PcbPortRender": {
                "dirty": false,
                "initialized": true,
              },
              "PcbPrimitiveRender": {
                "dirty": false,
                "initialized": true,
              },
              "PcbRouteNetIslands": {
                "dirty": false,
                "initialized": true,
              },
              "PcbTraceHintRender": {
                "dirty": false,
                "initialized": true,
              },
              "PcbTraceRender": {
                "dirty": false,
                "initialized": true,
              },
              "PortMatching": {
                "dirty": false,
                "initialized": true,
              },
              "ReactSubtreesRender": {
                "dirty": false,
                "initialized": true,
              },
              "SchematicComponentRender": {
                "dirty": false,
                "initialized": true,
              },
              "SchematicLayout": {
                "dirty": false,
                "initialized": true,
              },
              "SchematicPortRender": {
                "dirty": false,
                "initialized": true,
              },
              "SchematicTraceRender": {
                "dirty": false,
                "initialized": true,
              },
              "SourceAddConnectivityMapKey": {
                "dirty": false,
                "initialized": true,
              },
              "SourceParentAttachment": {
                "dirty": false,
                "initialized": true,
              },
              "SourceRender": {
                "dirty": false,
                "initialized": true,
              },
              "SourceTraceRender": {
                "dirty": false,
                "initialized": true,
              },
            },
            "schematic_component_id": "schematic_component_0",
            "shouldBeRemoved": false,
            "source_component_id": "source_component_0",
            "source_group_id": null,
          },
        ],
        "childrenPendingRemoval": [],
        "externallyAddedAliases": [],
        "isPcbPrimitive": false,
        "isPrimitiveContainer": true,
        "isSchematicPrimitive": false,
        "parent": RootCircuit {
          "_eventListeners": {},
          "_hasRenderedAtleastOnce": true,
          "children": [Circular],
          "db": {},
          "firstChild": [Circular],
          "isRoot": true,
          "name": undefined,
          "pcbDisabled": false,
          "pcbRoutingDisabled": false,
          "root": [Circular],
          "schematicDisabled": false,
        },
        "pcb_board_id": "pcb_board_0",
        "pcb_component_id": null,
        "pcb_group_id": null,
        "pcb_missing_footprint_error_id": undefined,
        "props": {
          "children": {
            "$$typeof": Symbol(react.transitional.element),
            "_debugInfo": null,
            "_owner": null,
            "_store": {
              "validated": 1,
            },
            "key": null,
            "props": {
              "footprint": "0402",
              "name": "R1",
              "resistance": "10k",
            },
            "ref": null,
            "type": "resistor",
          },
          "height": "10mm",
          "width": "10mm",
        },
        "reactSubtrees": [],
        "renderPhaseStates": {
          "CadModelRender": {
            "dirty": false,
            "initialized": true,
          },
          "CreateNetsFromProps": {
            "dirty": false,
            "initialized": true,
          },
          "CreateTraceHintsFromProps": {
            "dirty": false,
            "initialized": true,
          },
          "CreateTracesFromProps": {
            "dirty": false,
            "initialized": true,
          },
          "InitializePortsFromChildren": {
            "dirty": false,
            "initialized": true,
          },
          "PartsEngineRender": {
            "dirty": false,
            "initialized": true,
          },
          "PcbBoardAutoSize": {
            "dirty": false,
            "initialized": true,
          },
          "PcbComponentRender": {
            "dirty": false,
            "initialized": true,
          },
          "PcbComponentSizeCalculation": {
            "dirty": false,
            "initialized": true,
          },
          "PcbDesignRuleChecks": {
            "dirty": false,
            "initialized": true,
          },
          "PcbFootprintLayout": {
            "dirty": false,
            "initialized": true,
          },
          "PcbLayout": {
            "dirty": false,
            "initialized": true,
          },
          "PcbPortAttachment": {
            "dirty": false,
            "initialized": true,
          },
          "PcbPortRender": {
            "dirty": false,
            "initialized": true,
          },
          "PcbPrimitiveRender": {
            "dirty": false,
            "initialized": true,
          },
          "PcbRouteNetIslands": {
            "dirty": false,
            "initialized": true,
          },
          "PcbTraceHintRender": {
            "dirty": false,
            "initialized": true,
          },
          "PcbTraceRender": {
            "dirty": false,
            "initialized": true,
          },
          "PortMatching": {
            "dirty": false,
            "initialized": true,
          },
          "ReactSubtreesRender": {
            "dirty": false,
            "initialized": true,
          },
          "SchematicComponentRender": {
            "dirty": false,
            "initialized": true,
          },
          "SchematicLayout": {
            "dirty": false,
            "initialized": true,
          },
          "SchematicPortRender": {
            "dirty": false,
            "initialized": true,
          },
          "SchematicTraceRender": {
            "dirty": false,
            "initialized": true,
          },
          "SourceAddConnectivityMapKey": {
            "dirty": false,
            "initialized": true,
          },
          "SourceParentAttachment": {
            "dirty": false,
            "initialized": true,
          },
          "SourceRender": {
            "dirty": false,
            "initialized": true,
          },
          "SourceTraceRender": {
            "dirty": false,
            "initialized": true,
          },
        },
        "schematic_component_id": null,
        "shouldBeRemoved": false,
        "source_component_id": null,
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
      },
    ]
  `)

  expect(
    selectOne("board .R1", circuit as any, {
      adapter: primitiveComponentAdapter,
    }),
  ).toMatchInlineSnapshot(`null`)
})
