# Render Phases

The render phases in @tscircuit/core are defined in the `Renderable` class (`Renderable.ts`) and executed in a specific order. Each phase has a distinct purpose in the rendering process. Here's a description of each render phase:

1. ReactSubtreesRender: Renders React subtrees within components.
2. FootprintRender: Loads footprints, including from URLs, before ports are initialized.
3. InitializePortsFromChildren: Initializes ports based on the component's children.

4. CreateNetsFromProps: Creates nets based on the component's properties.

5. CreateTracesFromProps: Creates traces based on the component's properties.

6. SourceRender: Renders the source component, which is the basic representation of the component.

7. SourceParentAttachment: Attaches the source component to its parent.

8. PortMatching: Matches ports with their corresponding elements.

9. SourceTraceRender: Renders the source traces, which are the basic representations of connections between components.

10. SchematicComponentRender: Renders the schematic representation of the component.

11. SchematicLayout: Handles the layout of schematic components.

12. SchematicPortRender: Renders ports in the schematic view.

13. SchematicTraceRender: Renders traces in the schematic view.

14. PcbInsertTraceHints: Inserts trace hints into the PCB from "manual trace hints" or other props that imply trace hints

15. PcbComponentRender: Renders the PCB representation of the component.

16. PcbPrimitiveRender: Renders primitive PCB elements (e.g., pads, holes).

17. PcbFootprintLayout: Handles the layout of PCB footprints.

18. PcbPortRender: Renders ports in the PCB view.

19. PcbPortAttachment: Attaches ports to their corresponding PCB elements.

20. PcbLayout: Handles the overall layout of PCB components.

21. PcbTraceRender: Renders traces in the PCB view.

22. PcbTraceHintRender: Renders trace hints in the PCB view.

23. PcbRouteNetIslands: Routes connections between isolated net islands on the PCB.

24. PcbComponentSizeCalculation: Calculates the size of PCB components.

25. CadModelRender: Renders 3D CAD models of components.

Each of these phases is executed in order for every component in the project during the rendering process. Components can implement specific logic for each phase by defining methods like `doInitial<PhaseName>`, `update<PhaseName>`, or `remove<PhaseName>`.
