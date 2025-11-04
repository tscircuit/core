import "circuit-json"

declare module "circuit-json" {
  interface CadComponent {
    model_mtl_url?: string
  }

  interface PCBBoard {
    shape?: "rectangular" | "outlined"
  }

  interface PcbVia {
    net_is_assignable?: boolean
  }
}
