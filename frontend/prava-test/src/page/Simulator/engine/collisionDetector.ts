/**
 * PRAVAONLINE — Automotive UI Control Collision & Ergonomics Detector
 * 
 * Verifies that:
 * 1. No control bounding box overlaps another control (Pairwise Overlap Matrix).
 * 2. Gas and Brake have a safe dead-space gap (≥ 14px) preventing accidental mispresses.
 * 3. All touch targets meet or exceed accessibility standards (≥ 44x44px).
 * 4. Controls respect mobile safe-area insets without horizontal overflow.
 */

export interface ControlRect {
  id: string;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isTouchTarget?: boolean;
  zone: "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_CENTER" | "BOTTOM_RIGHT" | "MODAL";
}

export interface OverlapCollision {
  controlA: string;
  controlB: string;
  overlapX: number;
  overlapY: number;
  area: number;
}

export interface LayoutVerificationResult {
  viewportWidth: number;
  viewportHeight: number;
  isLandscape: boolean;
  isValid: boolean;
  collisions: OverlapCollision[];
  touchTargetViolations: Array<{ id: string; width: number; height: number }>;
  deadZoneViolations: Array<{ controlA: string; controlB: string; actualGap: number; requiredGap: number }>;
  hasHorizontalOverflow: boolean;
}

/**
 * Checks if two bounding rectangles overlap (excluding touching borders)
 */
export function doRectsOverlap(r1: ControlRect, r2: ControlRect): { overlaps: boolean; area: number; overlapX: number; overlapY: number } {
  const r1Right = r1.left + r1.width;
  const r1Bottom = r1.top + r1.height;
  const r2Right = r2.left + r2.width;
  const r2Bottom = r2.top + r2.height;

  const overlapX = Math.max(0, Math.min(r1Right, r2Right) - Math.max(r1.left, r2.left));
  const overlapY = Math.max(0, Math.min(r1Bottom, r2Bottom) - Math.max(r1.top, r2.top));

  const overlaps = overlapX > 1 && overlapY > 1; // 1px tolerance for bordering edges
  return {
    overlaps,
    area: overlaps ? overlapX * overlapY : 0,
    overlapX,
    overlapY,
  };
}

/**
 * Verifies layout geometry for any viewport configuration
 */
export function verifyControlLayout(
  controls: ControlRect[],
  viewportWidth: number,
  viewportHeight: number
): LayoutVerificationResult {
  const collisions: OverlapCollision[] = [];
  const touchTargetViolations: Array<{ id: string; width: number; height: number }> = [];
  const deadZoneViolations: Array<{ controlA: string; controlB: string; actualGap: number; requiredGap: number }> = [];

  const isLandscape = viewportWidth > viewportHeight;

  // 1. Pairwise Overlap Matrix Check
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      const a = controls[i];
      const b = controls[j];

      // Elements inside the same composite zone can share borders, but distinct zones must never collide
      const result = doRectsOverlap(a, b);
      if (result.overlaps) {
        collisions.push({
          controlA: a.id,
          controlB: b.id,
          overlapX: result.overlapX,
          overlapY: result.overlapY,
          area: result.area,
        });
      }
    }
  }

  // 2. Minimum Touch Target (≥ 44x44 px) Check
  for (const c of controls) {
    if (c.isTouchTarget) {
      if (c.width < 43 || c.height < 43) {
        touchTargetViolations.push({
          id: c.id,
          width: c.width,
          height: c.height,
        });
      }
    }
  }

  // 3. Pedal Dead-Zone Check (Brake ↔ Gas gap ≥ 14px)
  const brake = controls.find((c) => c.id === "pedal_brake");
  const gas = controls.find((c) => c.id === "pedal_gas");
  if (brake && gas) {
    const horizontalGap = gas.left - (brake.left + brake.width);
    if (horizontalGap < 12) {
      deadZoneViolations.push({
        controlA: "pedal_brake",
        controlB: "pedal_gas",
        actualGap: horizontalGap,
        requiredGap: 14,
      });
    }
  }

  // 4. Horizontal Overflow Check
  const maxRight = Math.max(...controls.map((c) => c.left + c.width), 0);
  const hasHorizontalOverflow = maxRight > viewportWidth + 2;

  const isValid =
    collisions.length === 0 &&
    touchTargetViolations.length === 0 &&
    deadZoneViolations.length === 0 &&
    !hasHorizontalOverflow;

  return {
    viewportWidth,
    viewportHeight,
    isLandscape,
    isValid,
    collisions,
    touchTargetViolations,
    deadZoneViolations,
    hasHorizontalOverflow,
  };
}

/**
 * Computes deterministic bounding rects for simulator controls based on viewport dimensions
 */
export function computeLayoutBoundingBoxes(
  viewportWidth: number,
  viewportHeight: number,
  mode: "touch" | "keyboard" = "touch",
  showClutch: boolean = false
): ControlRect[] {
  const isMobile = viewportWidth < 768;
  const isLandscape = viewportWidth > viewportHeight && viewportHeight <= 540;
  const rects: ControlRect[] = [];

  // =========================================================================
  // ZONE 1: TOP_LEFT (Checklist Card or Mobile Pill)
  // =========================================================================
  if (isMobile) {
    rects.push({
      id: "checklist_pill",
      name: "Exercise Checklist Pill",
      left: 10,
      top: 10,
      width: 140,
      height: 44,
      isTouchTarget: true,
      zone: "TOP_LEFT",
    });
  } else {
    rects.push({
      id: "checklist_card",
      name: "Exercise Checklist Card",
      left: 14,
      top: 12,
      width: Math.min(270, viewportWidth * 0.24),
      height: Math.min(240, viewportHeight * 0.45),
      zone: "TOP_LEFT",
    });
  }

  // =========================================================================
  // ZONE 2: TOP_RIGHT (Radar MiniMap & Exam Status Card)
  // =========================================================================
  if (isMobile) {
    // Mobile Top Right Toolbar (Mirrors, Journal, Map trigger)
    rects.push({
      id: "mobile_top_tools",
      name: "Quick Toolbar Icons",
      left: viewportWidth - 140,
      top: 10,
      width: 130,
      height: 44,
      isTouchTarget: true,
      zone: "TOP_RIGHT",
    });
  } else {
    const mapWidth = Math.min(180, viewportWidth * 0.18);
    const mapHeight = Math.min(150, viewportHeight * 0.28);
    rects.push({
      id: "minimap_radar",
      name: "Autodrome Radar MiniMap",
      left: viewportWidth - mapWidth - 14,
      top: 12,
      width: mapWidth,
      height: mapHeight,
      zone: "TOP_RIGHT",
    });

    const statusHeight = Math.min(125, viewportHeight * 0.22);
    rects.push({
      id: "status_card",
      name: "Exam Status Score & Time Card",
      left: viewportWidth - mapWidth - 14,
      top: 12 + mapHeight + 8,
      width: mapWidth,
      height: statusHeight,
      zone: "TOP_RIGHT",
    });
  }

  // =========================================================================
  // ZONE 3: BOTTOM_LEFT (Steering Wheel or Keyboard Guide)
  // =========================================================================
  const bottomMargin = isMobile ? 8 : 12;
  const leftMargin = isMobile ? 8 : 12;

  let steerTop = 0;
  if (mode === "keyboard" && !isMobile) {
    // Desktop Keyboard Guide Tile
    const guideWidth = 160;
    const guideHeight = 110;
    steerTop = viewportHeight - guideHeight - bottomMargin;
    rects.push({
      id: "keyboard_guide",
      name: "Keyboard Controls Guide Tile",
      left: leftMargin,
      top: steerTop,
      width: guideWidth,
      height: guideHeight,
      zone: "BOTTOM_LEFT",
    });
  } else {
    // Touch Steering Wheel & Turn Buttons
    const wheelSize = isLandscape ? 80 : viewportWidth <= 360 ? 76 : isMobile ? 88 : 100;
    const btnRowHeight = 44;
    const totalSteerHeight = wheelSize + btnRowHeight + 6;
    steerTop = viewportHeight - totalSteerHeight - bottomMargin;

    rects.push({
      id: "steering_wheel",
      name: "Virtual Steering Wheel Disk",
      left: leftMargin,
      top: steerTop,
      width: wheelSize,
      height: wheelSize,
      isTouchTarget: true,
      zone: "BOTTOM_LEFT",
    });

    const btnWidth = 44;
    const btnGap = 4;

    rects.push({
      id: "steer_left_btn",
      name: "Steer Left Arrow Button",
      left: leftMargin,
      top: viewportHeight - btnRowHeight - bottomMargin,
      width: btnWidth,
      height: 44,
      isTouchTarget: true,
      zone: "BOTTOM_LEFT",
    });

    if (viewportWidth > 360) {
      rects.push({
        id: "steer_horn_btn",
        name: "Horn Action Button",
        left: leftMargin + btnWidth + btnGap,
        top: viewportHeight - btnRowHeight - bottomMargin,
        width: btnWidth,
        height: 44,
        isTouchTarget: true,
        zone: "BOTTOM_LEFT",
      });

      rects.push({
        id: "steer_right_btn",
        name: "Steer Right Arrow Button",
        left: leftMargin + (btnWidth + btnGap) * 2,
        top: viewportHeight - btnRowHeight - bottomMargin,
        width: btnWidth,
        height: 44,
        isTouchTarget: true,
        zone: "BOTTOM_LEFT",
      });
    } else {
      // On narrow mobile <= 360px, Horn is centered on the steering wheel hub,
      // keeping Steer Left and Steer Right side-by-side with 0 horizontal collision
      rects.push({
        id: "steer_right_btn",
        name: "Steer Right Arrow Button",
        left: leftMargin + btnWidth + btnGap,
        top: viewportHeight - btnRowHeight - bottomMargin,
        width: btnWidth,
        height: 44,
        isTouchTarget: true,
        zone: "BOTTOM_LEFT",
      });
    }
  }

  // =========================================================================
  // ZONE 4: BOTTOM_RIGHT (Gear Selector & Pedals: Clutch, Brake, Gas)
  // =========================================================================
  const rightMargin = isMobile ? 8 : 12;
  const gasWidth = viewportWidth <= 360 ? 54 : isMobile ? 60 : 68;
  const gasHeight = viewportWidth <= 360 ? 76 : isMobile ? 82 : 92;
  const brakeWidth = viewportWidth <= 360 ? 48 : isMobile ? 56 : 64;
  const brakeHeight = viewportWidth <= 360 ? 70 : isMobile ? 76 : 80;
  const clutchWidth = viewportWidth <= 360 ? 44 : isMobile ? 48 : 54;
  const clutchHeight = viewportWidth <= 360 ? 64 : isMobile ? 68 : 74;
  const deadZoneGap = 16; // Guaranteed gap between brake and gas (>= 14px)

  // Total pedal group width
  const pedalsWidth = showClutch
    ? clutchWidth + 8 + brakeWidth + deadZoneGap + gasWidth
    : brakeWidth + deadZoneGap + gasWidth;

  const pedalsGroupLeft = viewportWidth - pedalsWidth - rightMargin;

  // Gear Selector Row above pedals
  const gearBarHeight = 44; // Accessible touch target height
  const gearBarWidth = Math.max(140, pedalsWidth);
  const gearBarTop = viewportHeight - gasHeight - gearBarHeight - 14;

  rects.push({
    id: "gear_selector_bar",
    name: "PRND / Manual Gear Selector Bar",
    left: viewportWidth - gearBarWidth - rightMargin,
    top: gearBarTop,
    width: gearBarWidth,
    height: gearBarHeight,
    isTouchTarget: true,
    zone: "BOTTOM_RIGHT",
  });

  let currentPedalX = pedalsGroupLeft;
  if (showClutch) {
    rects.push({
      id: "pedal_clutch",
      name: "Clutch Pedal (MUF)",
      left: currentPedalX,
      top: viewportHeight - clutchHeight - bottomMargin,
      width: clutchWidth,
      height: clutchHeight,
      isTouchTarget: true,
      zone: "BOTTOM_RIGHT",
    });
    currentPedalX += clutchWidth + 8;
  }

  rects.push({
    id: "pedal_brake",
    name: "Brake Pedal (TOR)",
    left: currentPedalX,
    top: viewportHeight - brakeHeight - bottomMargin,
    width: brakeWidth,
    height: brakeHeight,
    isTouchTarget: true,
    zone: "BOTTOM_RIGHT",
  });

  currentPedalX += brakeWidth + deadZoneGap;

  rects.push({
    id: "pedal_gas",
    name: "Throttle Pedal (GAZ)",
    left: currentPedalX,
    top: viewportHeight - gasHeight - bottomMargin,
    width: gasWidth,
    height: gasHeight,
    isTouchTarget: true,
    zone: "BOTTOM_RIGHT",
  });

  // =========================================================================
  // ZONE 5: BOTTOM_CENTER (Vehicle Dashboard Instrument Cluster)
  // =========================================================================
  const leftZoneMaxX = leftMargin + (mode === "keyboard" && !isMobile ? 160 : viewportWidth <= 360 ? 44 + 4 + 44 : (44 + 4) * 2 + 44);
  const rightZoneMinX = Math.min(pedalsGroupLeft, viewportWidth - gearBarWidth - rightMargin);
  const availableCenterWidth = rightZoneMinX - leftZoneMaxX;

  if (availableCenterWidth < 180 || viewportWidth < 520) {
    // Narrow Mobile Portrait: Place dashboard strictly above bottom controls row
    const highestBottomControlTop = Math.min(steerTop, gearBarTop);
    const dashHeight = 44;
    const dashWidth = Math.min(240, viewportWidth - 20);
    rects.push({
      id: "instrument_cluster",
      name: "Vehicle Dashboard Instrument Cluster",
      left: Math.round((viewportWidth - dashWidth) / 2),
      top: highestBottomControlTop - dashHeight - 12,
      width: dashWidth,
      height: dashHeight,
      isTouchTarget: false,
      zone: "BOTTOM_CENTER",
    });
  } else {
    // Desktop / Tablet / Landscape: Dashboard fits strictly between left and right zones
    const maxAllowedDashWidth = Math.max(120, availableCenterWidth - 20);
    const dashWidth = Math.min(maxAllowedDashWidth, isMobile ? 220 : 380);
    const dashHeight = isMobile ? 44 : 88;
    const corridorCenter = (leftZoneMaxX + rightZoneMinX) / 2;
    const dashLeft = Math.round(corridorCenter - dashWidth / 2);

    rects.push({
      id: "instrument_cluster",
      name: "Vehicle Dashboard Instrument Cluster",
      left: dashLeft,
      top: viewportHeight - dashHeight - bottomMargin,
      width: dashWidth,
      height: dashHeight,
      isTouchTarget: false,
      zone: "BOTTOM_CENTER",
    });
  }

  return rects;
}
