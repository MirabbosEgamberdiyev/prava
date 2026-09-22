/**
 * PRAVAONLINE — HTML5 Gamepad API Controller
 * Supports standard gamepads (Xbox, PlayStation, Logitech driving wheels, etc.)
 */

export interface GamepadControlState {
  connected: boolean;
  gamepadName: string;
  steer: number; // -1 to 1
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  handbrake: boolean;
  gearChange?: "P" | "R" | "N" | "D";
  horn: boolean;
  cameraToggle: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

const DEADZONE = 0.08;

function applyDeadzone(value: number): number {
  return Math.abs(value) < DEADZONE ? 0 : value;
}

export function pollGamepad(): GamepadControlState {
  if (typeof navigator === "undefined" || !navigator.getGamepads) {
    return {
      connected: false,
      gamepadName: "",
      steer: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      horn: false,
      cameraToggle: false,
      turnLeft: false,
      turnRight: false,
    };
  }

  const gamepads = navigator.getGamepads();
  let activeGp: Gamepad | null = null;
  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (gp && gp.connected) {
      activeGp = gp;
      break;
    }
  }

  if (!activeGp) {
    return {
      connected: false,
      gamepadName: "",
      steer: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      horn: false,
      cameraToggle: false,
      turnLeft: false,
      turnRight: false,
    };
  }

  // 1. Steering from Left Analog Stick (Axis 0)
  const rawSteer = activeGp.axes[0] ?? 0;
  const steer = applyDeadzone(rawSteer);

  // 2. Throttle from Right Trigger (Button 7 or fallback Axis 5)
  let throttle = 0;
  if (activeGp.buttons[7]) {
    throttle = activeGp.buttons[7].value ?? (activeGp.buttons[7].pressed ? 1 : 0);
  } else if (activeGp.axes[5] !== undefined) {
    throttle = Math.max(0, (activeGp.axes[5] + 1) / 2);
  }

  // 3. Brake from Left Trigger (Button 6 or fallback Axis 4)
  let brake = 0;
  if (activeGp.buttons[6]) {
    brake = activeGp.buttons[6].value ?? (activeGp.buttons[6].pressed ? 1 : 0);
  } else if (activeGp.axes[4] !== undefined) {
    brake = Math.max(0, (activeGp.axes[4] + 1) / 2);
  }

  // 4. Buttons
  const handbrake = activeGp.buttons[0]?.pressed ?? false; // A / Cross
  let gearChange: "P" | "R" | "N" | "D" | undefined = undefined;
  if (activeGp.buttons[1]?.pressed) gearChange = "D"; // B / Circle
  if (activeGp.buttons[2]?.pressed) gearChange = "R"; // X / Square
  if (activeGp.buttons[3]?.pressed) gearChange = "P"; // Y / Triangle

  const horn = activeGp.buttons[10]?.pressed ?? false; // L3 stick click
  const cameraToggle = activeGp.buttons[5]?.pressed ?? false; // RB / R1 bumper
  const turnLeft = activeGp.buttons[14]?.pressed ?? false; // D-pad Left
  const turnRight = activeGp.buttons[15]?.pressed ?? false; // D-pad Right

  return {
    connected: true,
    gamepadName: activeGp.id || "Standard Gamepad",
    steer,
    throttle: Math.max(0, Math.min(1, throttle)),
    brake: Math.max(0, Math.min(1, brake)),
    handbrake,
    gearChange,
    horn,
    cameraToggle,
    turnLeft,
    turnRight,
  };
}
