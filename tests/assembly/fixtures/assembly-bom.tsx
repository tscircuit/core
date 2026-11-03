import { assembly } from "lib"

/** Real TSX fixture shared by the BOM conversion test and downstream examples. */
export const AssemblyBomExample = () => (
  <assembly.device name="sensor">
    <assembly.subassembly
      name="housing"
      displayName="ABS enclosure"
      bomQuantity={2}
      purchaseUrls={[
        "https://amazon.com/dp/example",
        "https://store.example/enclosure",
      ]}
    >
      <assembly.part
        name="screws"
        displayName="M3 screws"
        bomQuantity={4}
        purchaseUrls={["https://store.example/m3"]}
      />
      <assembly.part
        name="module"
        supplierPartNumbers={{ jlcpcb: ["C123", "C456"] }}
        cadModel={
          <cadassembly>
            <cadmodel modelUrl="https://models.example/module.glb" />
            <cadmodel modelUrl="https://models.example/module-cap.glb" />
          </cadassembly>
        }
      />
    </assembly.subassembly>
  </assembly.device>
)
