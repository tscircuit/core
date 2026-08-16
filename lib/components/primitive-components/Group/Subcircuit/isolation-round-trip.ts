import type { PrimitiveComponent } from "../../../base-components/PrimitiveComponent"
import { isEphemeralDeclaration } from "./ephemeral-declarations"
import type { ISubcircuit } from "./ISubcircuit"

/**
 * Subcircuit isolation renders a subtree in its own circuit, throws the
 * components away, keeps the `AnyCircuitElement[]` and rebuilds components from
 * those records with `lib/utils/circuit-json/inflate-circuit-json.ts`.
 *
 * That is only transparent for the things an inflator knows how to rebuild.
 * Everything else takes one of two exits, and both used to be quiet:
 *
 * - no record at all (`<enclosure.cutoutaperture>`) -- dropped, no error anywhere
 * - a record with no inflator (`<netlabel>`) -- dropped, no error anywhere
 *
 * ...and one that is loud but fatal: an `ftype` the inflator's switch does not
 * have a case for (`<pinheader>`, `<crystal>`) throws mid-render.
 *
 * So the round trip is checked *before* it is taken. Anything this file does
 * not positively know how to rebuild means the subcircuit renders normally --
 * correct output, no cache -- and says so. The cache is worth 1.0x-1.33x on
 * 4-24 identical modules (measured, see the RFC); nothing about that is worth a
 * board that quietly comes out missing a part.
 *
 * The check itself is not what costs anything. It runs after the
 * `_isIsolatedSubcircuit` early return, so a circuit that never enables caching
 * -- which is every circuit rendered by eval, cli and runframe today -- pays
 * nothing, and the walk is ~0.3us per node (measured 2026-08-15: a 497-node
 * subcircuit of 40 passives and a QFN-64 took 0.15ms, 0.014% of its render).
 * What costs is the decision it makes: declining is worth the cache, no more --
 * 1.03x at 4 identical modules and 1.39x at 24, on the same circuit, with the
 * cache silently dropping a `<netlabel>` from each of them.
 *
 * See rfc/rfcs/2026-08-14-subcircuit-caching-must-be-lossless.md for the
 * measurements and for the fixes that would let entries be added here.
 */

/**
 * The allowlist, and what rebuilds each entry.
 *
 * This is paired with `inflate-circuit-json.ts` by hand: a component belongs
 * here only when that file has a path that produces it, and the value names
 * that path so the pairing can be checked by reading. `isolation-round-trip`
 * tests cover the entries that matter.
 *
 * Keyed by `componentName`, which is *not* the class name for every component:
 * a `<subcircuit>` is a `Subcircuit` instance reporting `"Group"`, and so is a
 * `<breakout>`.
 */
export const COMPONENTS_REBUILT_BY_INFLATORS: Record<string, string> = {
  // Containers
  Group: "inflateSourceGroup <- source_group (<subcircuit> reports Group too)",
  Board: "inflatePcbBoard <- pcb_board",

  // source_component, by ftype, per inflate-circuit-json's switch
  Resistor: "inflateSourceResistor <- source_component simple_resistor",
  Capacitor: "inflateSourceCapacitor <- source_component simple_capacitor",
  Inductor: "inflateSourceInductor <- source_component simple_inductor",
  Diode: "inflateSourceDiode <- source_component simple_diode",
  Fiducial: "inflateSourceFiducial <- source_component simple_fiducial",
  Led: "inflateSourceLed <- source_component simple_led",
  Chip: "inflateSourceChip <- source_component simple_chip",
  Jumper: "inflateSourceChip <- source_component simple_chip",
  SolderJumper: "inflateSourceChip <- source_component simple_chip",
  Connector: "inflateSourceConnector <- source_component simple_connector",
  Transistor: "inflateSourceTransistor <- source_component simple_transistor",
  Mosfet: "inflateSourceMosfet <- source_component simple_mosfet",
  PushButton: "inflateSourcePushButton <- source_component simple_push_button",
  Switch: "inflateSourceSwitch <- source_component simple_switch",

  // Connectivity
  Trace: "inflateSourceTrace <- source_trace",
  Port: "inflateSourcePort <- source_port",

  // Standalone PCB primitives, per inflateStandalonePcbPrimitives' type list
  SilkscreenRect: "inflateStandalonePcbPrimitives <- pcb_silkscreen_rect",
  SilkscreenCircle: "inflateStandalonePcbPrimitives <- pcb_silkscreen_circle",
  SilkscreenLine: "inflateStandalonePcbPrimitives <- pcb_silkscreen_line",
  SilkscreenPath: "inflateStandalonePcbPrimitives <- pcb_silkscreen_path",
  SilkscreenText: "inflateStandalonePcbPrimitives <- pcb_silkscreen_text",
  FabricationNoteText:
    "inflateStandalonePcbPrimitives <- pcb_fabrication_note_text",
  FabricationNotePath:
    "inflateStandalonePcbPrimitives <- pcb_fabrication_note_path",
  FabricationNoteRect:
    "inflateStandalonePcbPrimitives <- pcb_fabrication_note_rect",
  PcbNoteText: "inflateStandalonePcbPrimitives <- pcb_note_text",
  PcbNoteRect: "inflateStandalonePcbPrimitives <- pcb_note_rect",
  PcbNotePath: "inflateStandalonePcbPrimitives <- pcb_note_path",
  PcbNoteLine: "inflateStandalonePcbPrimitives <- pcb_note_line",
  PcbVia: "inflateStandalonePcbPrimitives <- pcb_via",
  Hole: "inflateStandalonePcbPrimitives <- pcb_hole",
  PlatedHole: "inflateStandalonePcbPrimitives <- pcb_plated_hole",
  Cutout: "inflateStandalonePcbPrimitives <- pcb_cutout",
}

/**
 * Containers whose *children* are declarations in their own right, so the walk
 * keeps checking inside them.
 *
 * Everything else in the allowlist is checked as a unit: a `<chip>`'s ports,
 * footprint and pads come back through `inflateFootprintComponent` /
 * `inflateSourcePort` as part of rebuilding the chip, so they are not separate
 * declarations to vet.
 */
const CONTAINER_COMPONENTS = new Set(["Group", "Board"])

export type IsolationBlockerReason = "emits-no-circuit-json" | "no-inflator"

export interface IsolationBlocker {
  component: PrimitiveComponent
  reason: IsolationBlockerReason
}

const REASON_EXPLANATION: Record<IsolationBlockerReason, string> = {
  "emits-no-circuit-json":
    "emits no Circuit JSON of its own, so there is no record to rebuild it from",
  "no-inflator":
    "has no inflator, so nothing rebuilds it from its Circuit JSON record",
}

/**
 * Everything in this subtree that isolation could not put back.
 *
 * Checked against the *live* children, before they are cleared, which is the
 * only moment both the tree and the decision exist together.
 */
export const findComponentsThatCannotSurviveIsolation = (
  subcircuit: ISubcircuit,
): IsolationBlocker[] => {
  const blockers: IsolationBlocker[] = []

  const visit = (
    component: PrimitiveComponent,
    { insideRebuiltComponent }: { insideRebuiltComponent: boolean },
  ) => {
    if (isEphemeralDeclaration(component)) {
      blockers.push({ component, reason: "emits-no-circuit-json" })
      return
    }

    const isRebuilt = component.componentName in COMPONENTS_REBUILT_BY_INFLATORS

    // Inside something the inflators rebuild whole (a chip's footprint, a
    // resistor's ports), the parts are not separate declarations -- but an
    // ephemeral declaration nested in there still has nowhere to come back
    // from, so the walk continues rather than stopping.
    if (!insideRebuiltComponent && !isRebuilt) {
      blockers.push({ component, reason: "no-inflator" })
      return
    }

    const descendAsRebuilt =
      insideRebuiltComponent ||
      !CONTAINER_COMPONENTS.has(component.componentName)

    for (const child of component.children ?? []) {
      visit(child as PrimitiveComponent, {
        insideRebuiltComponent: descendAsRebuilt,
      })
    }
  }

  const children = ((subcircuit as unknown as PrimitiveComponent).children ??
    []) as PrimitiveComponent[]
  for (const child of children) {
    visit(child, { insideRebuiltComponent: false })
  }

  return blockers
}

/**
 * One warning per distinct set of offenders per circuit: a board of 24 identical
 * modules has one problem, not 24, and a warning printed 24 times is a warning
 * that gets filtered out.
 */
const warnedSignaturesByRoot = new WeakMap<object, Set<string>>()

export const getIsolationDeclinedWarning = (
  subcircuit: ISubcircuit,
  blockers: IsolationBlocker[],
): string => {
  const lines = blockers.map(
    ({ component, reason }) =>
      `  - ${component.getString?.() ?? component.componentName} ${REASON_EXPLANATION[reason]}`,
  )
  const subcircuitName =
    (subcircuit as unknown as PrimitiveComponent).getString?.() ?? "subcircuit"

  return [
    `⚠️ subcircuit caching disabled for ${subcircuitName}: it contains ${blockers.length} declaration(s) that cannot be rebuilt from Circuit JSON, and caching would silently drop them:`,
    ...lines,
    "  This subcircuit rendered normally instead (correct output, no cache).",
    "  See rfc/rfcs/2026-08-14-subcircuit-caching-must-be-lossless.md",
  ].join("\n")
}

export const warnIsolationDeclined = (
  subcircuit: ISubcircuit,
  blockers: IsolationBlocker[],
): void => {
  const root = (subcircuit.root ?? subcircuit) as unknown as object
  let warnedSignatures = warnedSignaturesByRoot.get(root)
  if (!warnedSignatures) {
    warnedSignatures = new Set<string>()
    warnedSignaturesByRoot.set(root, warnedSignatures)
  }

  const signature = blockers
    .map(({ component, reason }) => `${component.componentName}:${reason}`)
    .join(",")
  if (warnedSignatures.has(signature)) return
  warnedSignatures.add(signature)

  console.warn(getIsolationDeclinedWarning(subcircuit, blockers))
}
