# 🧵 Khayyat × Sojo Model Architecture Blueprint
**File Name:** `SOJO_INTEGRATION_BLUEPRINT.md`  
**Purpose:** Integrating Sojo’s frictionless booking and clothing-care UX into Khayyat’s regional marketplace ecosystem.  
**Languages:** العربية (RTL) & English (LTR)

---

## 1. Core Workflow Translation (Sojo Model vs. Khayyat Marketplace)

| Stage | Sojo (UK Model) | Khayyat (Optimized for Regional/Local Markets) |
|---|---|---|
| **1. Request Entry** | App-based item & damage selection (e.g., zip replacement, trouser shortening). | **Multi-Category Guided Wizard**: Alteration, Repair, Custom Tailoring (Thobes, Abayas, Suits), or Fabric Request with photo & pinning guidance. |
| **2. Pricing Engine** | Instant fixed-price menu based on standardized damage types. | **Hybrid Pricing Architecture**: Standardized baseline reference rates + **Competitive Bidding / Quote System** where local workshops review photo/pinning details and submit bespoke bids (Price + Turnaround). |
| **3. Logistics & Transit** | Centralized bicycle couriers collecting and delivering items. | **Flexible Multi-Modal Logistics**: Integrated doorstep pickup & delivery tracking OR direct customer workshop drop-off. |
| **4. Fulfillment** | Handled by Sojo's in-house dark-tailoring studio or vetted micro-network. | Handled by **verified local tailoring workshops** with step-by-step milestone status updates & dispute protection. |

---

## 2. Feature Extraction: What to Take from Sojo

### A. The Frictionless 4-Step Booking Wizard
Sojo’s core strength is stripping away ambiguity. Rather than asking open-ended questions, Khayyat adopts a guided taxonomy:
1. **Select Item Type**:
   * Men's (Thobe, Pants/Jeans, Jacket, Shirt)
   * Women's (Abaya, Dress, Skirt, Blouse, Evening Gown)
   * General / Kids
2. **Select Service / Damage**:
   * Pants/Thobe: Hemming/Shortening, Waist taper, Leg narrowing, Zipper replacement.
   * Jackets/Abayas: Sleeve adjustment, Shoulder adjustment, Button/Snap repair.
   * Repairs: Tear patching, Lining fix, Seam reinforcement.
3. **Finish Details & Pinning Guidance**:
   * Measurement input or interactive pinning guide ("How to pin your trousers for hemming").
   * Garment photo upload & notes.
4. **Fulfillment Choice**:
   * Doorstep courier pickup & return vs. Self drop-off at workshop.

### B. Standardized Price Anchoring (Hybrid Pricing)
* Provide users with transparent **Estimated Baseline Market Rates** (e.g. Pants hem: ~20-35 SAR / $6-9; Zip replacement: ~15-25 SAR).
* Prevents price gouging while allowing workshops to compete on turnaround time, fabric quality, and reputation.

### C. Visual Order Timeline & Status Tracking
Real-time milestone tracking eliminates anxiety:

```
[Request Placed] 
      │
      ▼
[Quotes Received & Tailor Selected]
      │
      ▼
[Item Picked Up / Handed Over]
      │
      ▼
[At Workshop / In Progress]
      │
      ▼
[Quality Check & Ready]
      │
      ▼
[Out for Delivery]
      │
      ▼
[Completed & Reviewed]
```

---

## 3. Component Architecture & Implementation Blueprint

```
frontend/src/
├── components/
│   └── sojo/
│       ├── BookingWizard.tsx          # 4-step guided booking flow
│       ├── ItemTaxonomyPicker.tsx     # Visual item & category selection
│       ├── DamageServiceChecklist.tsx # Damage/alteration itemized list with baseline rates
│       ├── PinningGuideModal.tsx      # Visual tutorial on pinning clothes for alteration
│       ├── VisualOrderTracker.tsx     # Milestone tracker for active orders
│       └── TailorRFQDrawer.tsx        # Tailor 1-click bid submission drawer
```

---

## 4. Sustainability & Garment Care Positioning

Khayyat integrates Sojo's sustainability narrative tailored to regional values:
* **"Extend the Life of Your Garments"**: Reducing fashion waste through premium repairs and resizing.
* **Preserving Craftsmanship**: Directly empowering local artisans, preserving traditional tailoring skills.
* **Transparent Quality Badges**: Highlighting precision, turnaround adherence, and fabric care.
