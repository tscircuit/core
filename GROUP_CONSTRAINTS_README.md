 

## Usage

You can now set constraints between groups using the same constraint syntax as components, but referencing group names:

```tsx
<board pcbLayout={{ pack: true }}>
  <group name="group1" pcbLayout={{ pack: true }}>
    <resistor name="R1" resistance="1k" footprint="0402" />
    <capacitor name="C1" capacitance="100nF" footprint="0402" />
  </group>
  
  <group name="group2" pcbLayout={{ pack: true }}>
    <resistor name="R2" resistance="2.2k" footprint="0402" />
    <led name="LED1" footprint="0402" />
  </group>

  {/* Set 20mm distance between groups and center them at X=0 */}
  <constraint pcb xDist="20mm" left=".group1" right=".group2" centerX={0} />
</board>
```

## Features Implemented

### 1. Distance Constraints
- `xDist`: Sets horizontal distance between group centers
- `yDist`: Sets vertical distance between group centers

### 2. Centering Constraints
- `centerX`: Positions both groups so their average X coordinate equals the specified value
- `centerY`: Positions both groups so their average Y coordinate equals the specified value

 