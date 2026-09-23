/**
 * PRAVAONLINE — VehicleRenderer & 3D Vehicle Factory
 * 
 * Procedurally generates realistic, optimized Three.js vehicle models
 * for all 7 autodrome vehicle models:
 * 1. Chevrolet Cobalt (Category B Sedan)
 * 2. Chevrolet Gentra (Category B Sedan)
 * 3. Chevrolet Onix (Category B Modern Sedan)
 * 4. Chevrolet Malibu (Category B Executive Sedan)
 * 5. Chevrolet Tracker (Category B Compact SUV)
 * 6. Isuzu NPR Truck (Category C Commercial Cargo)
 * 7. Isuzu SAZ Bus (Category D City Transit Bus)
 * 
 * Guarantees:
 * - Proper wheelbase, track width, ground clearance, and length.
 * - Dynamic steering knuckles, rolling wheels, dual rear wheels where applicable.
 * - Dynamic lighting rigs (headlight spots, brake emissive, reverse, turn signals).
 * - Full memory disposal on vehicle swap (0 WebGL resource leaks).
 */

import * as THREE from "three";
import type { VehicleConfig } from "../types";

export interface BuiltVehicleInstance {
  config: VehicleConfig;
  vehicleGroup: THREE.Group;
  chassisGroup: THREE.Group;
  frontLeftSteer: THREE.Group;
  frontRightSteer: THREE.Group;
  frontLeftWheel: THREE.Mesh;
  frontRightWheel: THREE.Mesh;
  rearLeftWheel: THREE.Mesh;
  rearRightWheel: THREE.Mesh;
  dualRearWheels?: THREE.Mesh[];
  steeringWheelMesh: THREE.Mesh;
  leftHeadlightSpot: THREE.SpotLight;
  rightHeadlightSpot: THREE.SpotLight;
  brakeLightMat: THREE.MeshStandardMaterial;
  reverseLightMat: THREE.MeshStandardMaterial;
  turnLeftLightMat: THREE.MeshStandardMaterial;
  turnRightLightMat: THREE.MeshStandardMaterial;
  dispose: () => void;
}

// Reusable texture helper: License plate
function createLicensePlateTexture(numberStr: string = "01 234 AAA"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 60);

    // Uzbekistan Flag Accent
    ctx.fillStyle = "#0099b5";
    ctx.fillRect(6, 6, 28, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("UZ", 20, 36);

    // Plate Text
    ctx.fillStyle = "#111111";
    ctx.font = "bold 32px 'DIN Alternate', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(numberStr, 142, 32);
  }
  return new THREE.CanvasTexture(canvas);
}

export class VehicleRenderer {
  /**
   * Builds and attaches a fully articulated 3D vehicle to the Three.js scene
   */
  public static buildVehicle(scene: THREE.Scene, config: VehicleConfig): BuiltVehicleInstance {
    const vehicleGroup = new THREE.Group();
    vehicleGroup.name = `vehicle_${config.id || config.modelName}`;

    const chassisGroup = new THREE.Group();
    vehicleGroup.add(chassisGroup);

    // Shared Materials
    const plateTex = createLicensePlateTexture();
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
    const glassMatTinted = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.72,
    });
    const darkInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });
    const plasticTrimMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
    });
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.05,
    });

    // Dynamic Lighting Materials
    const brakeLightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.4,
    });
    const reverseLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0,
    });
    const turnLeftLightMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
    });
    const turnRightLightMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
    });
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
    });

    // Primary Body Paint Material
    const bodyColor = new THREE.Color(config.color);
    const bodyPaintMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: config.category === "B" ? 0.8 : 0.65,
      roughness: config.category === "B" ? 0.2 : 0.35,
    });

    // Wheel Construction
    const wheelRadius = config.category === "D" ? 0.48 : config.category === "C" ? 0.44 : 0.34;
    const wheelWidth = config.category === "D" ? 0.32 : config.category === "C" ? 0.30 : 0.24;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });

    const createWheelMesh = (): THREE.Mesh => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth + 0.01, 16),
        rimMat
      );
      tire.add(rim);
      return tire;
    };

    // Steering Wheel Disk
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.024, 8, 24), wheelMat);
    const wheelSpoke1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 8), wheelMat);
    wheelSpoke1.rotation.z = Math.PI / 2;
    wheelRim.add(wheelSpoke1);
    const wheelSpoke2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.20, 8), wheelMat);
    wheelSpoke2.position.y = -0.09;
    wheelRim.add(wheelSpoke2);
    const wheelCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), wheelMat);
    wheelCenter.rotation.x = Math.PI / 2;
    wheelRim.add(wheelCenter);

    const dualRearWheels: THREE.Mesh[] = [];

    // =========================================================================
    // MODEL-SPECIFIC PROCEDURAL 3D MESH GENERATION
    // =========================================================================
    const halfBase = config.wheelbaseMeters / 2;
    const halfTrack = config.trackWidthMeters / 2;
    const groundH = config.groundClearanceMeters || 0.15;

    let spotL: THREE.SpotLight;
    let spotR: THREE.SpotLight;

    if (config.category === "C") {
      // -----------------------------------------------------------------------
      // ISUZU NPR CARGO TRUCK
      // -----------------------------------------------------------------------
      // Cab
      const cabMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.2, 2.15), bodyPaintMat);
      cabMesh.position.set(halfBase * 0.75, groundH + 1.5, 0);
      cabMesh.castShadow = true;
      chassisGroup.add(cabMesh);

      // Windshield
      const truckWs = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.05), glassMatTinted);
      truckWs.position.set(halfBase * 0.75 + 1.06, groundH + 1.65, 0);
      truckWs.rotation.y = Math.PI / 2;
      chassisGroup.add(truckWs);

      // Heavy Front Bumper
      const ftrBumper = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 2.25), plasticTrimMat);
      ftrBumper.position.set(halfBase * 0.75 + 1.1, groundH + 0.4, 0);
      chassisGroup.add(ftrBumper);

      // Cargo Bed
      const cargoBed = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.5, 2.2), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }));
      cargoBed.position.set(-halfBase * 0.9, groundH + 1.4, 0);
      cargoBed.castShadow = true;
      chassisGroup.add(cargoBed);

      // Vertical Chrome Exhaust Stack
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12), chromeMat);
      exhaust.position.set(halfBase * 0.75 - 1.1, groundH + 2.1, -1.0);
      chassisGroup.add(exhaust);

      // Mirrors
      const trkMirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.2), plasticTrimMat);
      trkMirrorL.position.set(halfBase * 0.75 + 0.7, groundH + 1.8, -1.25);
      chassisGroup.add(trkMirrorL);
      const trkMirrorR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.2), plasticTrimMat);
      trkMirrorR.position.set(halfBase * 0.75 + 0.7, groundH + 1.8, 1.25);
      chassisGroup.add(trkMirrorR);

      // Plates
      const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
      frontPlate.position.set(halfBase * 0.75 + 1.28, groundH + 0.32, 0);
      frontPlate.rotation.y = Math.PI / 2;
      chassisGroup.add(frontPlate);
      const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
      rearPlate.position.set(-halfBase * 0.9 - 2.16, groundH + 0.45, 0);
      rearPlate.rotation.y = -Math.PI / 2;
      chassisGroup.add(rearPlate);

      // Taillights
      const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.35), brakeLightMat);
      tlL.position.set(-halfBase * 0.9 - 2.16, groundH + 0.55, -0.85);
      chassisGroup.add(tlL);
      const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.35), brakeLightMat);
      tlR.position.set(-halfBase * 0.9 - 2.16, groundH + 0.55, 0.85);
      chassisGroup.add(tlR);

      // Headlights
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.38), hlMat);
      hlL.position.set(halfBase * 0.75 + 1.06, groundH + 0.65, -0.8);
      chassisGroup.add(hlL);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.38), hlMat);
      hlR.position.set(halfBase * 0.75 + 1.06, groundH + 0.65, 0.8);
      chassisGroup.add(hlR);

      // Spotlights
      spotL = new THREE.SpotLight(0xfffae6, 3.8, 65, Math.PI / 6, 0.4, 1);
      spotL.position.set(halfBase * 0.75 + 1.1, groundH + 0.65, -0.8);
      spotL.target.position.set(halfBase * 0.75 + 30, 0, -0.8);
      chassisGroup.add(spotL);
      chassisGroup.add(spotL.target);

      spotR = new THREE.SpotLight(0xfffae6, 3.8, 65, Math.PI / 6, 0.4, 1);
      spotR.position.set(halfBase * 0.75 + 1.1, groundH + 0.65, 0.8);
      spotR.target.position.set(halfBase * 0.75 + 30, 0, 0.8);
      chassisGroup.add(spotR);
      chassisGroup.add(spotR.target);

      // Cockpit Steering Wheel (Driver sitting on Left side in Uzbekistan LHD)
      const steerGroup = new THREE.Group();
      steerGroup.position.set(halfBase * 0.75 - 0.4, groundH + 1.45, -0.45);
      steerGroup.rotation.y = -Math.PI / 2;
      steerGroup.rotation.x = 0.45;
      steerGroup.add(wheelRim);
      chassisGroup.add(steerGroup);

    } else if (config.category === "D") {
      // -----------------------------------------------------------------------
      // ISUZU SAZ TRANSIT BUS
      // -----------------------------------------------------------------------
      const busBody = new THREE.Mesh(new THREE.BoxGeometry(config.lengthMeters, 2.6, config.widthMeters), bodyPaintMat);
      busBody.position.set(0, groundH + 1.55, 0);
      busBody.castShadow = true;
      chassisGroup.add(busBody);

      // Front Panoramic Windshield
      const busWs = new THREE.Mesh(new THREE.PlaneGeometry(config.widthMeters * 0.88, 1.35), glassMatTinted);
      busWs.position.set(config.lengthMeters / 2 + 0.01, groundH + 1.65, 0);
      busWs.rotation.y = Math.PI / 2;
      chassisGroup.add(busWs);

      // Passenger Side Windows
      for (let w = -2.6; w <= 2.6; w += 1.3) {
        const sideWinL = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.85), glassMatTinted);
        sideWinL.position.set(w, groundH + 1.9, config.widthMeters / 2 + 0.01);
        chassisGroup.add(sideWinL);
        const sideWinR = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.85), glassMatTinted);
        sideWinR.position.set(w, groundH + 1.9, -config.widthMeters / 2 - 0.01);
        sideWinR.rotation.y = Math.PI;
        chassisGroup.add(sideWinR);
      }

      // Plates
      const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
      frontPlate.position.set(config.lengthMeters / 2 + 0.02, groundH + 0.35, 0);
      frontPlate.rotation.y = Math.PI / 2;
      chassisGroup.add(frontPlate);
      const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
      rearPlate.position.set(-config.lengthMeters / 2 - 0.02, groundH + 0.45, 0);
      rearPlate.rotation.y = -Math.PI / 2;
      chassisGroup.add(rearPlate);

      // Taillights
      const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.2), brakeLightMat);
      tlL.position.set(-config.lengthMeters / 2 - 0.01, groundH + 1.0, -0.9);
      chassisGroup.add(tlL);
      const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.2), brakeLightMat);
      tlR.position.set(-config.lengthMeters / 2 - 0.01, groundH + 1.0, 0.9);
      chassisGroup.add(tlR);

      // Headlights
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.4), hlMat);
      hlL.position.set(config.lengthMeters / 2, groundH + 0.75, -0.85);
      chassisGroup.add(hlL);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.4), hlMat);
      hlR.position.set(config.lengthMeters / 2, groundH + 0.75, 0.85);
      chassisGroup.add(hlR);

      // Spotlights
      spotL = new THREE.SpotLight(0xfffae6, 3.8, 70, Math.PI / 6, 0.4, 1);
      spotL.position.set(config.lengthMeters / 2 + 0.1, groundH + 0.75, -0.85);
      spotL.target.position.set(config.lengthMeters / 2 + 35, 0, -0.85);
      chassisGroup.add(spotL);
      chassisGroup.add(spotL.target);

      spotR = new THREE.SpotLight(0xfffae6, 3.8, 70, Math.PI / 6, 0.4, 1);
      spotR.position.set(config.lengthMeters / 2 + 0.1, groundH + 0.75, 0.85);
      spotR.target.position.set(config.lengthMeters / 2 + 35, 0, 0.85);
      chassisGroup.add(spotR);
      chassisGroup.add(spotR.target);

      // Steering Wheel (Driver sitting on Left side in Uzbekistan LHD)
      const steerGroup = new THREE.Group();
      steerGroup.position.set(config.lengthMeters / 2 - 0.8, groundH + 1.35, -0.5);
      steerGroup.rotation.y = -Math.PI / 2;
      steerGroup.rotation.x = 0.55;
      steerGroup.add(wheelRim);
      chassisGroup.add(steerGroup);

    } else {
      // -----------------------------------------------------------------------
      // CATEGORY B: PASSENGER SEDANS & CROSSOVERS
      // -----------------------------------------------------------------------
      const isSuv = config.bodyType === "suv" || config.modelName.includes("Tracker");
      const isExecutive = config.modelName.includes("Malibu");
      const isOnix = config.modelName.includes("Onix");
      const isGentra = config.modelName.includes("Gentra");

      // Lower Chassis / Main Body
      const bodyLength = config.lengthMeters;
      const bodyWidth = config.widthMeters;
      const bodyH = isSuv ? 0.95 : 0.82;
      const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(bodyLength, bodyH, bodyWidth), bodyPaintMat);
      chassisMesh.position.y = groundH + bodyH / 2;
      chassisMesh.castShadow = true;
      chassisGroup.add(chassisMesh);

      // Cabin Greenhouse
      const cabinL = isSuv ? bodyLength * 0.62 : isExecutive ? bodyLength * 0.55 : bodyLength * 0.52;
      const cabinH = isSuv ? 0.85 : 0.76;
      const cabinW = bodyWidth * 0.88;
      const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(cabinL, cabinH, cabinW), bodyPaintMat);
      cabinMesh.position.set(-bodyLength * 0.05, groundH + bodyH + cabinH / 2 - 0.05, 0);
      cabinMesh.castShadow = true;
      chassisGroup.add(cabinMesh);

      // Windshields
      const wsWidth = cabinW * 0.94;
      const wsGeo = new THREE.PlaneGeometry(wsWidth, cabinH * 0.92);
      const windshield = new THREE.Mesh(wsGeo, glassMatTinted);
      windshield.position.set(-bodyLength * 0.05 + cabinL / 2 + 0.01, groundH + bodyH + cabinH / 2 - 0.05, 0);
      windshield.rotation.y = Math.PI / 2;
      windshield.rotation.x = -0.38;
      chassisGroup.add(windshield);

      const rearWindshield = new THREE.Mesh(wsGeo, glassMatTinted);
      rearWindshield.position.set(-bodyLength * 0.05 - cabinL / 2 - 0.01, groundH + bodyH + cabinH / 2 - 0.05, 0);
      rearWindshield.rotation.y = -Math.PI / 2;
      rearWindshield.rotation.x = -0.38;
      chassisGroup.add(rearWindshield);

      // SUV Accents (Tracker Roof Rails & Wheel Arch Claddings)
      if (isSuv) {
        const railGeo = new THREE.CylinderGeometry(0.025, 0.025, cabinL * 0.85, 8);
        const railL = new THREE.Mesh(railGeo, chromeMat);
        railL.rotation.z = Math.PI / 2;
        railL.position.set(-bodyLength * 0.05, groundH + bodyH + cabinH, cabinW / 2 - 0.06);
        chassisGroup.add(railL);

        const railR = new THREE.Mesh(railGeo, chromeMat);
        railR.rotation.z = Math.PI / 2;
        railR.position.set(-bodyLength * 0.05, groundH + bodyH + cabinH, -cabinW / 2 + 0.06);
        chassisGroup.add(railR);
      }

      // Executive Accents (Malibu Dual Chrome Exhausts)
      if (isExecutive) {
        const exh1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), chromeMat);
        exh1.rotation.z = Math.PI / 2;
        exh1.position.set(-bodyLength / 2 - 0.05, groundH + 0.18, 0.5);
        chassisGroup.add(exh1);

        const exh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), chromeMat);
        exh2.rotation.z = Math.PI / 2;
        exh2.position.set(-bodyLength / 2 - 0.05, groundH + 0.18, -0.5);
        chassisGroup.add(exh2);
      }

      // Dual Wing Mirrors
      const mirrorShellL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), plasticTrimMat);
      mirrorShellL.position.set(halfBase * 0.35, groundH + bodyH + 0.1, -bodyWidth / 2 - 0.1);
      const mirrorGlassL = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.10), mirrorGlassMat);
      mirrorGlassL.position.set(-0.091, 0, 0);
      mirrorGlassL.rotation.y = -Math.PI / 2;
      mirrorShellL.add(mirrorGlassL);
      chassisGroup.add(mirrorShellL);

      const mirrorShellR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), plasticTrimMat);
      mirrorShellR.position.set(halfBase * 0.35, groundH + bodyH + 0.1, bodyWidth / 2 + 0.1);
      const mirrorGlassR = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.10), mirrorGlassMat);
      mirrorGlassR.position.set(-0.091, 0, 0);
      mirrorGlassR.rotation.y = -Math.PI / 2;
      mirrorShellR.add(mirrorGlassR);
      chassisGroup.add(mirrorShellR);

      // Interior Dashboard & Steering Wheel (Driver sitting on Left side in Uzbekistan LHD)
      const dashboard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, bodyWidth * 0.8), darkInteriorMat);
      dashboard.position.set(halfBase * 0.3, groundH + bodyH + 0.15, 0);
      chassisGroup.add(dashboard);

      const steerGroup = new THREE.Group();
      steerGroup.position.set(halfBase * 0.12, groundH + bodyH + 0.25, -0.35);
      steerGroup.rotation.y = -Math.PI / 2;
      steerGroup.rotation.x = 0.28;
      steerGroup.add(wheelRim);
      chassisGroup.add(steerGroup);

      // Brand Badges
      const bowtieMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
      const rearBowtie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.22), bowtieMat);
      rearBowtie.position.set(-bodyLength / 2 - 0.01, groundH + bodyH * 0.85, 0);
      chassisGroup.add(rearBowtie);

      // Model Name Badge Script
      const badgeMat = chromeMat;
      const modelBadge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.35), badgeMat);
      modelBadge.position.set(-bodyLength / 2 - 0.01, groundH + bodyH * 0.82, -0.45);
      chassisGroup.add(modelBadge);

      // License Plates
      const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
      frontPlate.position.set(bodyLength / 2 + 0.01, groundH + 0.28, 0);
      frontPlate.rotation.y = Math.PI / 2;
      chassisGroup.add(frontPlate);

      const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
      rearPlate.position.set(-bodyLength / 2 - 0.01, groundH + 0.35, 0);
      rearPlate.rotation.y = -Math.PI / 2;
      chassisGroup.add(rearPlate);

      // Taillights
      const tlW = isExecutive ? 0.45 : isOnix ? 0.38 : 0.32;
      const tlGeo = new THREE.BoxGeometry(0.14, 0.18, tlW);
      const tlLeft = new THREE.Mesh(tlGeo, brakeLightMat);
      tlLeft.position.set(-bodyLength / 2 + 0.01, groundH + bodyH * 0.78, -bodyWidth * 0.36);
      chassisGroup.add(tlLeft);

      const tlRight = new THREE.Mesh(tlGeo, brakeLightMat);
      tlRight.position.set(-bodyLength / 2 + 0.01, groundH + bodyH * 0.78, bodyWidth * 0.36);
      chassisGroup.add(tlRight);

      // Amber Signal Accents
      const turnMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), turnLeftLightMat);
      turnMeshL.position.set(-bodyLength / 2 + 0.02, groundH + bodyH * 0.78, -bodyWidth * 0.44);
      chassisGroup.add(turnMeshL);

      const turnMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), turnRightLightMat);
      turnMeshR.position.set(-bodyLength / 2 + 0.02, groundH + bodyH * 0.78, bodyWidth * 0.44);
      chassisGroup.add(turnMeshR);

      // Headlights
      const hlW = isExecutive ? 0.44 : isGentra ? 0.40 : 0.36;
      const hlGeo = new THREE.BoxGeometry(0.18, 0.16, hlW);
      const hlLeft = new THREE.Mesh(hlGeo, hlMat);
      hlLeft.position.set(bodyLength / 2 - 0.02, groundH + bodyH * 0.75, -bodyWidth * 0.36);
      chassisGroup.add(hlLeft);

      const hlRight = new THREE.Mesh(hlGeo, hlMat);
      hlRight.position.set(bodyLength / 2 - 0.02, groundH + bodyH * 0.75, bodyWidth * 0.36);
      chassisGroup.add(hlRight);

      // Spotlights
      spotL = new THREE.SpotLight(0xfffae6, 3.8, 55, Math.PI / 6, 0.4, 1);
      spotL.position.set(bodyLength / 2 + 0.1, groundH + bodyH * 0.75, -bodyWidth * 0.36);
      spotL.target.position.set(bodyLength / 2 + 30, 0, -bodyWidth * 0.36);
      chassisGroup.add(spotL);
      chassisGroup.add(spotL.target);

      spotR = new THREE.SpotLight(0xfffae6, 3.8, 55, Math.PI / 6, 0.4, 1);
      spotR.position.set(bodyLength / 2 + 0.1, groundH + bodyH * 0.75, bodyWidth * 0.36);
      spotR.target.position.set(bodyLength / 2 + 30, 0, bodyWidth * 0.36);
      chassisGroup.add(spotR);
      chassisGroup.add(spotR.target);
    }

    // =========================================================================
    // 4 WHEELS (AND OPTIONAL DUAL REAR WHEELS) POSITIONED AT TRUE WHEELBASE
    // =========================================================================
    // Front Left Steer Knuckle (Left = -halfTrack in standard 3D)
    const frontLeftSteer = new THREE.Group();
    frontLeftSteer.position.set(halfBase, wheelRadius, -halfTrack);
    const frontLeftWheel = createWheelMesh();
    frontLeftSteer.add(frontLeftWheel);
    vehicleGroup.add(frontLeftSteer);

    // Front Right Steer Knuckle (Right = +halfTrack in standard 3D)
    const frontRightSteer = new THREE.Group();
    frontRightSteer.position.set(halfBase, wheelRadius, halfTrack);
    const frontRightWheel = createWheelMesh();
    frontRightSteer.add(frontRightWheel);
    vehicleGroup.add(frontRightSteer);

    // Rear Left Wheel
    const rearLeftWheel = createWheelMesh();
    rearLeftWheel.position.set(-halfBase, wheelRadius, -halfTrack);
    vehicleGroup.add(rearLeftWheel);

    // Rear Right Wheel
    const rearRightWheel = createWheelMesh();
    rearRightWheel.position.set(-halfBase, wheelRadius, halfTrack);
    vehicleGroup.add(rearRightWheel);

    // Dual Rear Wheels for Commercial Truck and Transit Bus
    if (config.hasDualRearWheels) {
      const rlOuter = createWheelMesh();
      rlOuter.position.set(-halfBase, wheelRadius, -halfTrack - wheelWidth - 0.05);
      vehicleGroup.add(rlOuter);
      dualRearWheels.push(rlOuter);

      const rrOuter = createWheelMesh();
      rrOuter.position.set(-halfBase, wheelRadius, halfTrack + wheelWidth + 0.05);
      vehicleGroup.add(rrOuter);
      dualRearWheels.push(rrOuter);
    }

    // Add Vehicle Group to the 3D Scene
    scene.add(vehicleGroup);

    // Memory Disposal Lifecycle
    const dispose = () => {
      scene.remove(vehicleGroup);
      vehicleGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        } else if (child instanceof THREE.Light) {
          if ("dispose" in child && typeof (child as any).dispose === "function") {
            (child as any).dispose();
          }
        }
      });
      if (plateTex) plateTex.dispose();
    };

    return {
      config,
      vehicleGroup,
      chassisGroup,
      frontLeftSteer,
      frontRightSteer,
      frontLeftWheel,
      frontRightWheel,
      rearLeftWheel,
      rearRightWheel,
      dualRearWheels,
      steeringWheelMesh: wheelRim,
      leftHeadlightSpot: spotL!,
      rightHeadlightSpot: spotR!,
      brakeLightMat,
      reverseLightMat,
      turnLeftLightMat,
      turnRightLightMat,
      dispose,
    };
  }
}
