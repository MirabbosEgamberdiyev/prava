import { updateVehiclePhysics, type ControlInput } from "../engine/vehiclePhysics";
import { checkCollisions } from "../engine/collisionEngine";
import { evaluateSensors } from "../engine/sensorEngine";
import { createPenaltyEvent, calculateTotalScore } from "../engine/penaltyEngine";
import { VEHICLE_CONFIGS } from "../registry/vehicleConfigs";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import type { VehicleTelemetry } from "../types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

function runTests() {
  console.log("==================================================");
  console.log("RUNNING AVTODROM SIMULATOR VERIFICATION SUITE");
  console.log("==================================================");

  const cobaltConfig = VEHICLE_CONFIGS["Chevrolet Cobalt"];
  assert(!!cobaltConfig && cobaltConfig.modelName === "Chevrolet Cobalt", "Cobalt configuration exists");

  // Initial Telemetry
  let telemetry: VehicleTelemetry = {
    posX: 100,
    posY: 100,
    speed: 0,
    rotation: 0,
    steeringAngle: 0,
    gear: "D",
    handbrake: false,
    rpm: 800,
    rollbackDistance: 0,
    throttle: 0,
    brake: 0,
    turnSignal: "none",
    seatbeltFastened: true,
    lowBeamsOn: true,
  };

  const controls: ControlInput = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
  };

  // Test 1: Throttle Acceleration in Drive
  controls.throttle = 1.0;
  telemetry = updateVehiclePhysics(telemetry, controls, cobaltConfig, 1.0, false);
  assert(telemetry.speed > 0, "Vehicle accelerates with throttle in D gear");
  assert(telemetry.rpm > 800, "Engine RPM increases during acceleration");

  // Test 2: Braking Deceleration
  controls.throttle = 0;
  controls.brake = 1.0;
  telemetry = updateVehiclePhysics(telemetry, controls, cobaltConfig, 2.0, false);
  assert(telemetry.speed === 0, "Vehicle comes to a full stop with brake applied");

  // Test 3: Park Gear Disengages Motion
  telemetry.gear = "P";
  controls.throttle = 1.0;
  controls.brake = 0;
  telemetry = updateVehiclePhysics(telemetry, controls, cobaltConfig, 1.0, false);
  assert(telemetry.speed === 0, "Vehicle does not move forward when gear is P");

  // Test 4: Reverse Gear Backs Up
  telemetry.gear = "R";
  controls.throttle = 0.5;
  telemetry = updateVehiclePhysics(telemetry, controls, cobaltConfig, 1.0, false);
  assert(telemetry.speed < 0, "Vehicle moves backwards (negative speed) in Reverse gear");

  // Test 5: Estakada 16% Incline Rollback Simulation
  telemetry.gear = "D";
  telemetry.speed = 0;
  telemetry.rollbackDistance = 0;
  controls.throttle = 0;
  controls.brake = 0;
  controls.handbrake = false;
  // On incline
  telemetry = updateVehiclePhysics(telemetry, controls, cobaltConfig, 1.0, true);
  assert(telemetry.speed < 0, "Vehicle experiences gravity rollback on 16% incline");
  assert(telemetry.rollbackDistance > 0, "Incline rollback sensor tracks rollback distance");

  // Test 6: Incline Rollback Exceeded Sensor (> 20 cm)
  const rollbackExercise = EXERCISE_REGISTRY.find((e) => e.code === "ESTAKADA")!;
  telemetry.rollbackDistance = 0.25; // 25 cm > 20 cm
  const sensorEval = evaluateSensors(telemetry, rollbackExercise);
  assert(sensorEval.isRollbackViolated === true, "Sensor detects rollback exceeding 20 cm on Estakada");

  // Test 7: Collision Engine (Cone hit)
  const coneExercise = EXERCISE_REGISTRY.find((e) => e.code === "SLALOM")!;
  const firstCone = coneExercise.cones ? coneExercise.cones[0] : { x: 445, y: 300, radius: 6 };
  telemetry.posX = firstCone.x;
  telemetry.posY = firstCone.y;
  const collisionResult = checkCollisions(telemetry, coneExercise);
  assert(collisionResult.hasCollision === true, "Collision engine detects collision");
  assert(collisionResult.type === "cone", "Collision type is identified as cone");

  // Test 8: Penalty Engine Scoring & Instant Fail
  const minorEvent = createPenaltyEvent("LIGHTS_NOT_TURNED_ON", 1, 5, 0, 0);
  assert(minorEvent.points === 10, "Minor lights event created with 10 pts");

  const scoreMinor = calculateTotalScore([minorEvent]);
  assert(scoreMinor.totalPoints === 10, "Total penalty points match");
  assert(scoreMinor.isPassed === true, "Session passes with 10 penalty points (< 100)");

  const failEvent = createPenaltyEvent("WALL_COLLISION", 1, 10, 0, 0);
  const scoreFail = calculateTotalScore([minorEvent, failEvent]);
  assert(scoreFail.totalPoints === 110, "Total penalty points summed up to 110");
  assert(scoreFail.isPassed === false, "Session fails when points >= 100 or instant fail triggered");
  assert(scoreFail.hasInstantFail === true, "Instant fail flag is properly raised");

  console.log("==================================================");
  console.log("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎯");
  console.log("==================================================");
}

runTests();
