import type { Subpanel } from "./Subpanel"
import { getOwningPanel } from "lib/utils/panels/get-owning-panel"
import {
  DEFAULT_TAB_LENGTH,
  DEFAULT_TAB_WIDTH,
  generatePanelOutlineRoutingCutouts,
  generatePanelTabsAndMouseBites,
} from "lib/utils/panels/generate-panel-tabs-and-mouse-bites"
import { generatePanelVScoreAnnotations } from "lib/utils/panels/generate-panel-v-score-annotations"
import { generateControlledPanelTabs } from "lib/utils/panels/generate-controlled-panel-tabs"

export function Subpanel_generatePanelizationFeatures(subpanel: Subpanel) {
  if (subpanel._panelizationFeaturesGenerated) return

  const { db } = subpanel.root!
  const props = subpanel._parsedProps
  if (
    subpanel.componentName !== "Panel" &&
    (props.minWidth !== undefined ||
      props.maxWidth !== undefined ||
      props.minHeight !== undefined ||
      props.maxHeight !== undefined)
  )
    throw new Error("Panel size limits must be configured on the root <panel>")
  const panelizationMethod = props.panelizationMethod ?? "none"
  // Use _getAllBoardInstances to include boards inside nested subpanels
  const childBoardInstances = subpanel._getAllBoardInstances()

  if (panelizationMethod !== "none") {
    // Get all boards that are children of this panel/subpanel (including nested)
    const childBoardIds = childBoardInstances
      .map((c) => c.pcb_board_id)
      .filter((id): id is string => !!id)

    const boardsInPanel = db.pcb_board
      .list()
      .filter((b) => childBoardIds.includes(b.pcb_board_id!))

    if (boardsInPanel.length === 0) return

    const tabWidth = props.tabWidth ?? DEFAULT_TAB_WIDTH

    if (panelizationMethod === "v_score") {
      if (subpanel.componentName !== "Panel" || !subpanel.pcb_panel_id)
        throw new Error("V-scoring must be configured on the root <panel>")
      if ((props.boardGap ?? 0) !== 0)
        throw new Error(
          "V-scoring requires boardGap={0}; routed gaps cannot be V-scored",
        )
      generatePanelVScoreAnnotations(
        {
          boards: boardsInPanel,
          panel: db.pcb_panel.get(subpanel.pcb_panel_id)!,
        },
        subpanel.root!,
      )
    } else if (panelizationMethod === "outline_routing") {
      const outlineRoutingCutouts = generatePanelOutlineRoutingCutouts(
        boardsInPanel,
        { cutoutWidth: tabWidth },
      )

      for (const outlineRoutingCutout of outlineRoutingCutouts) {
        db.pcb_cutout.insert({
          ...outlineRoutingCutout,
          pcb_group_id: subpanel.pcb_group_id ?? undefined,
          pcb_panel_id: getOwningPanel(subpanel)?.pcb_panel_id ?? undefined,
          subcircuit_id: subpanel.subcircuit_id ?? undefined,
        })
      }
    } else {
      const boardGap = props.boardGap ?? tabWidth
      const hasTabControls =
        props.tabCountPerEdge !== undefined ||
        props.tabs !== undefined ||
        props.tabKeepouts !== undefined
      const { tabCutouts, mouseBiteHoles } = hasTabControls
        ? generateControlledPanelTabs(
            boardsInPanel.map((board) => ({
              board,
              boardName:
                childBoardInstances.find(
                  (childBoard) =>
                    childBoard.pcb_board_id === board.pcb_board_id,
                )?.name ?? "unnamed board",
            })),
            {
              tabCountPerEdge: props.tabCountPerEdge,
              tabs: props.tabs,
              tabKeepouts: props.tabKeepouts,
              tabWidth,
              tabLength: props.tabLength ?? DEFAULT_TAB_LENGTH,
              mouseBites: props.mouseBites ?? true,
            },
          )
        : generatePanelTabsAndMouseBites(boardsInPanel, {
            boardGap,
            tabWidth,
            tabLength: props.tabLength ?? DEFAULT_TAB_LENGTH,
            mouseBites: props.mouseBites ?? true,
          })

      for (const tabCutout of tabCutouts) {
        db.pcb_cutout.insert({
          ...tabCutout,
          subcircuit_id: subpanel.subcircuit_id ?? undefined,
          pcb_panel_id: getOwningPanel(subpanel)?.pcb_panel_id ?? undefined,
        })
      }

      for (const mouseBiteHole of mouseBiteHoles) {
        db.pcb_hole.insert({
          ...mouseBiteHole,
          subcircuit_id: subpanel.subcircuit_id ?? undefined,
        })
      }
    }
  }

  subpanel._panelizationFeaturesGenerated = true
}
