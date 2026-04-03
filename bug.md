# TSCircuit Non-JLCPCB Bug List

This document lists all bugs identified from the logs that are NOT related to JLCPCB search or import.

---

## Bug 12: React `key` prop misuse warning

**Evidence:**
```log
trace: `key` is not a prop. Trying to access it will result in `undefined`
```

**Bug / Issue:**  
The system is incorrectly accessing the React `key` prop inside components.

**Why it matters:**  
`key` is a special React attribute and should not be accessed like a normal prop.

**Impact:**  
- Warning noise  
- Potential rendering issues  

**Severity:** Low–Medium

---

## Bug 13: Missing unique `key` in list rendering

**Evidence:**
```log
Each child in a list should have a unique "key" prop.
```

**Bug / Issue:**  
List elements are rendered without unique keys.

**Impact:**  
- Unstable rendering  
- Debug warnings  

**Severity:** Medium

---

## Bug 14: Autorouter failed due to iteration limit

**Evidence:**
```log
AutorouterError: Ef ran out of iterations
```

**Bug / Issue:**  
Autorouter cannot complete routing.

**Impact:**  
- Incomplete PCB  

**Severity:** High

---

## Bug 15: Autorouter async execution error

**Evidence:**
```log
Async effect error in PcbTraceRender "capacity-mesh-autorouting"
```

**Bug / Issue:**  
Internal routing engine error.

**Impact:**  
- Unstable routing  

**Severity:** Medium–High

---

## Bug 16: Build completed with errors

**Evidence:**
```log
⚠ Build completed with errors
```

**Bug / Issue:**  
Build is not clean.

**Impact:**  
- Unreliable output  

**Severity:** Medium

---

## Bug 17: Contradictory build status

**Evidence:**
```log
⚠ Build completed with errors
Build exiting with code 0
```

**Bug / Issue:**  
Error + success shown together.

**Impact:**  
- Confusing status  

**Severity:** High

---

## Bug 18: Component placed off-board

**Evidence:**
```log
USB1 ... [offboard]
```

**Bug / Issue:**  
Component outside PCB boundary.

**Impact:**  
- Invalid layout  

**Severity:** High

---

## Bug 19: Excessive component distance

**Evidence:**
```log
distance: 12.713mm / 17.483mm
```

**Bug / Issue:**  
Critical components placed too far.

**Impact:**  
- Signal issues  

**Severity:** Medium–High

---

## Bug 20: Zero pad clearance

**Evidence:**
```log
padClearance=0mm
```

**Bug / Issue:**  
Pads touching.

**Impact:**  
- Short circuit risk  

**Severity:** Critical

---

## Bug 21: Snapshot generated despite routing failure

**Evidence:**
```log
snapshots created even after autorouter error
```

**Bug / Issue:**  
Tool reports success despite failure.

**Impact:**  
- Misleading results  

**Severity:** Medium–High