# Render Phases

The render phases in @tscircuit/core are defined in the `Renderable` class (`Renderable.ts`) and executed in a specific order. Each phase has a distinct purpose in the rendering process. Here's a description of each render phase:

1. ReactSubtreesRender: Renders React subtrees within components.
2. PcbFootprintStringRender: Loads footprints, including from URLs, before ports are initialized.
3. InitializePortsFromChildren: Initializes ports based on the component's children.

4. CreateNetsFromProps: Creates nets based on the component's properties.

5. CreateTracesFromProps: Creates traces based on the component's properties.

6. SourceGroupRender: Creates the source group for subcircuits and assigns a `subcircuit_id`.

7. SourceRender: Renders the source component, which is the basic representation of the component.

8. SourceParentAttachment: Attaches the source component to its parent.

9. PortMatching: Matches ports with their corresponding elements.

10. SourceTraceRender: Renders the source traces, which are the basic representations of connections between components.

11. SchematicComponentRender: Renders the schematic representation of the component.

12. SchematicLayout: Handles the layout of schematic components.

13. SchematicPortRender: Renders ports in the schematic view.

14. SchematicTraceRender: Renders traces in the schematic view.

15. PcbInsertTraceHints: Inserts trace hints into the PCB from "manual trace hints" or other props that imply trace hints

16. PcbComponentRender: Renders the PCB representation of the component.

17. PcbPrimitiveRender: Renders primitive PCB elements (e.g., pads, holes).

18. PcbFootprintLayout: Handles the layout of PCB footprints.

19. PcbPortRender: Renders ports in the PCB view.

20. PcbPortAttachment: Attaches ports to their corresponding PCB elements.

21. PcbLayout: Handles the overall layout of PCB components.

22. PcbTraceRender: Renders traces in the PCB view.

23. PcbTraceHintRender: Renders trace hints in the PCB view.

24. PcbRouteNetIslands: Routes connections between isolated net islands on the PCB.

25. PcbComponentSizeCalculation: Calculates the size of PCB components.

26. PcbComponentAnchorAlignment: Aligns PCB component center based on a specified anchor point.

27. CadModelRender: Renders 3D CAD models of components.

Each of these phases is executed in order for every component in the project during the rendering process. Components can implement specific logic for each phase by defining methods like `doInitial<PhaseName>`, `update<PhaseName>`, or `remove<PhaseName>`.
