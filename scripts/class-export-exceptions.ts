/** Existing exports whose extraction would fragment their owning class API.
 * Match exact files and symbols: never exempt an entire file or directory.
 */
export const classExportExceptions = [
  {
    file: "lib/components/base-components/NormalComponent/NormalComponent.ts",
    exports: ["PortMap"],
    reason:
      "Keep the existing portMap return type colocated until there is a shared port-types module; do not add a Port type file to NormalComponent.",
  },
  {
    file: "lib/components/base-components/PrimitiveComponent/PrimitiveComponent.ts",
    exports: ["BaseComponentConfig"],
    reason:
      "The config contract belongs to PrimitiveComponent and its subclasses.",
  },
  {
    file: "lib/components/normal-components/VoltageSource.ts",
    exports: ["WaveShape"],
    reason:
      "A standalone file for this existing voltage-source type adds no useful separation.",
  },
  {
    file: "lib/components/primitive-components/BaseBreakoutPoint.ts",
    exports: ["baseBreakoutPointProps"],
    reason:
      "Subclasses extend their base class's schema; keep that contract together.",
  },
  {
    file: "lib/components/primitive-components/Constraint.ts",
    exports: ["EdgeSpecifier"],
    reason: "The type derives from Constraint's private edge-specifier list.",
  },
  {
    file: "lib/components/primitive-components/CopperPour/CopperPour.ts",
    exports: ["CopperPourProps"],
    reason:
      "Retain the existing compatibility type re-export without creating a forwarding-only module.",
  },
  {
    file: "lib/components/primitive-components/PcbTrace.ts",
    exports: ["pcbTraceProps", "PcbTraceProps"],
    reason:
      "Keep this primitive's schema and inferred props with their implementation.",
  },
  {
    file: "lib/components/primitive-components/PcbVia.ts",
    exports: ["pcbViaProps", "PcbViaProps"],
    reason:
      "Keep the via schema, compatibility fields, and props with their implementation.",
  },
  {
    file: "lib/errors/TraceConnectionError.ts",
    exports: ["TraceConnectionErrorData"],
    reason:
      "The error payload is the constructor contract of this error class.",
  },
  {
    file: "lib/utils/autorouting/CapacityMeshAutorouter.ts",
    exports: [
      "SolverStartedDetails",
      "AutorouterOptions",
      "AutorouterSolverName",
      "getAutorouterSolverName",
    ],
    reason:
      "Existing solver selection and option contracts need a deliberate routing-module refactor, not an options file containing runtime helpers.",
  },
  {
    file: "lib/utils/autorouting/FanoutAutorouter.ts",
    exports: [
      "FanoutAutorouterMode",
      "FanoutAutorouterOptions",
      "ResolveFanoutBoundsOptions",
      "getFanoutSolverBuses",
    ],
    reason:
      "Bus resolution shares direction helpers with the autorouter; extraction would expand their exported API solely to satisfy this check.",
  },
]
