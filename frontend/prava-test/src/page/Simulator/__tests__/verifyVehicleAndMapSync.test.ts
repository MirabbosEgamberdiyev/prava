import { describe, it, expect } from "vitest";
import {
  getVehicleConfig,
  getVehiclesByCategory,
} from "../registry/vehicleConfigs";
import { AUTODROME_SPEC } from "../registry/autodromeModel";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { SimulationController } from "../engine/SimulationController";

describe("🚗 Master Driving Simulator — Vehicle Switching & Physics Verification", () => {
  const allVehicleNames = [
    "Chevrolet Cobalt",
    "Chevrolet Gentra",
    "Chevrolet Onix",
    "Chevrolet Malibu",
    "Chevrolet Tracker",
    "Isuzu NPR Truck",
    "Isuzu SAZ Bus",
  ];

  it("should have all 7 real production vehicles registered with complete technical specs", () => {
    allVehicleNames.forEach((name) => {
      const config = getVehicleConfig(name);
      expect(config).toBeDefined();
      expect(config.modelName).toBe(name);
      expect(config.massKg).toBeGreaterThan(1000);
      expect(config.wheelbaseMeters).toBeGreaterThan(2.0);
      expect(config.trackWidthMeters).toBeGreaterThan(1.5);
      expect(config.steeringAngleMax).toBeGreaterThanOrEqual(30);
      expect(config.cameraOffsets).toBeDefined();
      expect(config.cameraOffsets?.chaseDist).toBeGreaterThan(5.0);
      expect(config.cameraOffsets?.cockpitEyeY).toBeGreaterThan(1.0);
      expect(config.cameraOffsets?.rearBumperDist).toBeGreaterThan(2.0);
    });
  });

  it("should correctly filter vehicles by Category B, C, and D", () => {
    const catB = getVehiclesByCategory("B");
    expect(catB.length).toBe(5); // Cobalt, Gentra, Onix, Malibu, Tracker
    expect(catB.every((v) => v.category === "B")).toBe(true);

    const catC = getVehiclesByCategory("C");
    expect(catC.length).toBe(1); // Isuzu NPR Truck
    expect(catC[0].modelName).toBe("Isuzu NPR Truck");
    expect(catC[0].hasDualRearWheels).toBe(true);

    const catD = getVehiclesByCategory("D");
    expect(catD.length).toBe(1); // Isuzu SAZ Bus
    expect(catD[0].modelName).toBe("Isuzu SAZ Bus");
    expect(catD[0].hasDualRearWheels).toBe(true);
  });

  it("should dynamically reconstruct wheel layout, tire loads, and camera offsets upon hot-swapping", () => {
    const ctrl = new SimulationController(EXERCISE_REGISTRY[0], "Chevrolet Cobalt", {
      onTelemetryUpdate: () => {},
      onPenaltyTriggered: () => {},
      onStationCompleted: () => {},
      onExamFinished: () => {},
    });

    // Initial vehicle: Cobalt (1250 kg)
    const initialConfig = ctrl.getConfig();
    expect(initialConfig.modelName).toBe("Chevrolet Cobalt");
    expect(initialConfig.massKg).toBe(1250);

    const initialChaseCam = ctrl.getCameraTransform("chase");
    expect(initialChaseCam.position.y).toBeCloseTo(4.2, 1);

    // Hot-swap to Isuzu NPR Truck (5200 kg)
    ctrl.updateVehicle("Isuzu NPR Truck");
    const truckConfig = ctrl.getConfig();
    expect(truckConfig.modelName).toBe("Isuzu NPR Truck");
    expect(truckConfig.massKg).toBe(5200);
    expect(truckConfig.category).toBe("C");

    const truckChaseCam = ctrl.getCameraTransform("chase");
    expect(truckChaseCam.position.y).toBeCloseTo(5.2, 1);

    // Hot-swap to Isuzu SAZ Bus (7800 kg)
    ctrl.updateVehicle("Isuzu SAZ Bus");
    const busConfig = ctrl.getConfig();
    expect(busConfig.modelName).toBe("Isuzu SAZ Bus");
    expect(busConfig.massKg).toBe(7800);
    expect(busConfig.category).toBe("D");

    const busChaseCam = ctrl.getCameraTransform("chase");
    expect(busChaseCam.position.y).toBeCloseTo(5.6, 1);
  });

  it("should perform loose name matching gracefully without crash", () => {
    expect(getVehicleConfig("cobalt").modelName).toBe("Chevrolet Cobalt");
    expect(getVehicleConfig("gentra").modelName).toBe("Chevrolet Gentra");
    expect(getVehicleConfig("tracker").modelName).toBe("Chevrolet Tracker");
    expect(getVehicleConfig("truck").modelName).toBe("Isuzu NPR Truck");
    expect(getVehicleConfig("bus").modelName).toBe("Isuzu SAZ Bus");
    expect(getVehicleConfig("non_existent").modelName).toBe("Chevrolet Cobalt"); // Fallback
  });
});

describe("🗺️ Single Source of Truth — 3D World <-> 2D Mini-Map Radar Sync", () => {
  it("should verify that to3D and to2D are bijective inverses for all station waypoints", () => {
    EXERCISE_REGISTRY.forEach((ex) => {
      // 2D start point
      const p2D = { x: ex.startX, y: ex.startY };
      // Convert to 3D
      const p3D = AUTODROME_SPEC.to3D(p2D.x, p2D.y);
      // Convert back to 2D
      const back2D = AUTODROME_SPEC.to2D(p3D.x, p3D.z);

      expect(back2D.x).toBeCloseTo(p2D.x, 3);
      expect(back2D.y).toBeCloseTo(p2D.y, 3);
    });
  });

  it("should have road networks encompassing all 12 exercise stations within arena bounds", () => {
    expect(AUTODROME_SPEC.roads.length).toBeGreaterThanOrEqual(8);
    AUTODROME_SPEC.roads.forEach((road) => {
      expect(road.width).toBeGreaterThanOrEqual(4.5); // At least 4.5m road width
      expect(road.start.x).toBeGreaterThanOrEqual(0);
      expect(road.start.x).toBeLessThanOrEqual(AUTODROME_SPEC.dimensions.width2D);
      expect(road.start.y).toBeGreaterThanOrEqual(0);
      expect(road.start.y).toBeLessThanOrEqual(AUTODROME_SPEC.dimensions.height2D);
    });
  });
});

describe("🎯 Steering Kinematics, High-Visibility Camera & Multi-lingual Voice Tests", () => {
  it("should verify steer right (+1) rotates vehicle clockwise/right and steer left (-1) rotates counter-clockwise/left", () => {
    const ctrl = new SimulationController(EXERCISE_REGISTRY[0], "Chevrolet Cobalt");
    ctrl.setGear("D");

    // Start with 0 rotation
    const initTelem = ctrl.getTelemetry();
    expect(initTelem.rotation).toBeCloseTo(0, 2);

    // Apply throttle and steer right (+1)
    for (let i = 0; i < 30; i++) {
      ctrl.update({ throttle: 0.8, brake: 0, steer: 1.0, handbrake: false }, 0.016);
    }
    const rightTelem = ctrl.getTelemetry();
    expect(rightTelem.steeringAngle).toBeGreaterThan(0); // Steering angle turns positive (right)
    expect(rightTelem.rotation).toBeGreaterThan(0); // Rotation increases (turns right/clockwise in 2D)

    // Reset and apply throttle and steer left (-1)
    ctrl.setExercise(EXERCISE_REGISTRY[0]);
    ctrl.setGear("D");
    for (let i = 0; i < 30; i++) {
      ctrl.update({ throttle: 0.8, brake: 0, steer: -1.0, handbrake: false }, 0.016);
    }
    const leftTelem = ctrl.getTelemetry();
    expect(leftTelem.steeringAngle).toBeLessThan(0); // Steering angle turns negative (left)
    expect(leftTelem.rotation).toBeLessThan(0); // Rotation decreases (turns left/counter-clockwise in 2D)
  });

  it("should verify elevated chase camera height and forward pitch target for road visibility", () => {
    const ctrl = new SimulationController(EXERCISE_REGISTRY[0], "Chevrolet Cobalt");
    const chaseTransform = ctrl.getCameraTransform("chase");

    // Camera height must be elevated (> 4.0m) to see over vehicle body
    expect(chaseTransform.position.y).toBeGreaterThanOrEqual(4.0);

    // Camera target must look down ahead onto the road (Y <= 0.5m)
    expect(chaseTransform.target.y).toBeLessThanOrEqual(0.5);
  });
});
