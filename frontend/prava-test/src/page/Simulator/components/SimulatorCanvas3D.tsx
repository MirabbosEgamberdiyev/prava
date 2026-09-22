import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { VehicleTelemetry, ExerciseDefinition, CameraView } from "../types";

interface Props {
  telemetry: VehicleTelemetry;
  exercise: ExerciseDefinition;
  cameraView: CameraView;
  showHelpers: boolean;
  onCanvasClick?: () => void;
}

// Helper: Create high-contrast procedural canvas texture
function createTextCanvasTexture(
  text: string,
  width: number,
  height: number,
  bgColor: string,
  fgColor: string,
  fontSize: number = 32,
  fontWeight: string = "bold",
  subText?: string
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = fgColor;
    ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (subText) {
      ctx.fillText(text, width / 2, height * 0.4);
      ctx.font = `normal ${Math.round(fontSize * 0.55)}px sans-serif`;
      ctx.fillText(subText, width / 2, height * 0.75);
    } else {
      ctx.fillText(text, width / 2, height / 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// Helper: Create Uzbek state license plate texture
function createUzbekLicensePlateTexture(numberStr: string = "01 234 AAA"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // White background plate
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 64);

    // Black plate border
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 60);

    // Left blue band for UZ flag
    ctx.fillStyle = "#0099b5";
    ctx.fillRect(6, 6, 28, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("UZ", 20, 36);

    // License text
    ctx.fillStyle = "#111111";
    ctx.font = "bold 32px 'DIN Alternate', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(numberStr, 142, 32);
  }
  return new THREE.CanvasTexture(canvas);
}

// Helper: Red-and-white alternating curb texture
function createCurbStripedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(64, 0, 64, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 1);
  return tex;
}

// Helper: Asphalt road surface with dashed lines
function createAsphaltRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Dark asphalt
    ctx.fillStyle = "#272e39";
    ctx.fillRect(0, 0, 256, 256);

    // Subtle asphalt noise
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    // Outer solid white road lines
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(12, 0, 6, 256);
    ctx.fillRect(238, 0, 6, 256);

    // Center dashed line
    ctx.fillStyle = "#facc15";
    for (let y = 16; y < 256; y += 64) {
      ctx.fillRect(125, y, 6, 36);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 10);
  return tex;
}

export default function SimulatorCanvas3D({
  telemetry,
  exercise: _exercise,
  cameraView,
  showHelpers: _showHelpers,
  onCanvasClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Vehicle meshes and animation references
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const frontLeftSteerRef = useRef<THREE.Group | null>(null);
  const frontRightSteerRef = useRef<THREE.Group | null>(null);
  const frontLeftWheelMeshRef = useRef<THREE.Mesh | null>(null);
  const frontRightWheelMeshRef = useRef<THREE.Mesh | null>(null);
  const rearLeftWheelMeshRef = useRef<THREE.Mesh | null>(null);
  const rearRightWheelMeshRef = useRef<THREE.Mesh | null>(null);

  // Vehicle dynamic lighting
  const leftHeadlightSpotRef = useRef<THREE.SpotLight | null>(null);
  const rightHeadlightSpotRef = useRef<THREE.SpotLight | null>(null);
  const brakeLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const reverseLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const turnLeftLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const turnRightLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Traffic light dynamic meshes
  const trafficRedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficYellowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficGreenMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficLightTimerRef = useRef<number>(0);

  // Cameras
  const chaseCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cockpitCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const topDownCameraRef = useRef<THREE.OrthographicCamera | null>(null);

  // Estakada elevation calculation
  const getElevationAndPitch = (x: number, y: number) => {
    // Estakada zone: X in [250, 350], Y in [410, 470]
    if (x >= 250 && x <= 350 && y >= 410 && y <= 470) {
      if (x <= 290) {
        // Incline ramp
        const progress = (x - 250) / 40;
        return { elevationY: progress * 2.4, pitch: -0.16 };
      } else if (x <= 310) {
        // Flat plateau summit
        return { elevationY: 2.4, pitch: 0 };
      } else {
        // Decline ramp
        const progress = (x - 310) / 40;
        return { elevationY: (1 - progress) * 2.4, pitch: 0.16 };
      }
    }
    return { elevationY: 0, pitch: 0 };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup with realistic atmospheric fog & sky color
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2332);
    scene.fog = new THREE.FogExp2(0x1a2332, 0.0035);
    sceneRef.current = scene;

    // 2. Camera Setup
    const aspect = width / height;
    const chaseCam = new THREE.PerspectiveCamera(54, aspect, 0.1, 1000);
    chaseCameraRef.current = chaseCam;

    const cockpitCam = new THREE.PerspectiveCamera(62, aspect, 0.05, 1000);
    cockpitCameraRef.current = cockpitCam;

    const frustumSize = 130;
    const topDownCam = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    topDownCam.position.set(0, 160, 0);
    topDownCam.lookAt(0, 0, 0);
    topDownCameraRef.current = topDownCam;

    // 3. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.warn("WebGLRenderer initialization failed", e);
      return;
    }

    // 4. Photorealistic Lighting
    // Ambient & Hemisphere sky/ground light
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.7);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    // Sunlight directional light
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(90, 140, 70);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    const d = 110;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 5. Autodrome Ground & Environment Architecture
    // 5.1 Grass Terrain Base
    const grassGeo = new THREE.PlaneGeometry(450, 400);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x1d3625,
      roughness: 0.9,
      metalness: 0.05,
    });
    const grassGround = new THREE.Mesh(grassGeo, grassMat);
    grassGround.rotation.x = -Math.PI / 2;
    grassGround.position.y = -0.05;
    grassGround.receiveShadow = true;
    scene.add(grassGround);

    // 5.2 Perimeter Fencing & Curbs
    const curbTex = createCurbStripedTexture();
    const curbMat = new THREE.MeshStandardMaterial({
      map: curbTex,
      roughness: 0.7,
      metalness: 0.1,
    });

    const createCurbBorder = (w: number, d: number, px: number, pz: number) => {
      const geo = new THREE.BoxGeometry(w, 0.35, d);
      const mesh = new THREE.Mesh(geo, curbMat);
      mesh.position.set(px, 0.175, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    // Outer autodrome boundary curbs
    createCurbBorder(340, 2, 0, -115);
    createCurbBorder(340, 2, 0, 115);
    createCurbBorder(2, 230, -170, 0);
    createCurbBorder(2, 230, 170, 0);

    // 5.3 Main Asphalt Road Network
    const roadMat = new THREE.MeshStandardMaterial({
      map: createAsphaltRoadTexture(),
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15,
    });

    const createRoadSegment = (w: number, d: number, px: number, pz: number) => {
      const geo = new THREE.PlaneGeometry(w, d);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(px, 0.01, pz);
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    // Bottom Track Corridor: START -> PEDESTRIAN -> ESTAKADA
    createRoadSegment(180, 14, -20, 76);
    // Right Track Corridor: CORRIDOR -> SLALOM -> INTERSECTION
    createRoadSegment(14, 160, 88, 0);
    // Top Track Corridor: GARAGE -> RAILWAY -> ACCEL
    createRoadSegment(160, 14, 10, -66);
    // Left Track Corridor: EMERGENCY -> PARALLEL -> FINISH
    createRoadSegment(14, 150, -96, 6);

    // 5.4 Road Markings: START and FINISH Lines
    const startTex = createTextCanvasTexture("START", 256, 128, "#00000000", "#f8fafc", 50);
    const startMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4),
      new THREE.MeshBasicMaterial({ map: startTex, transparent: true })
    );
    startMesh.rotation.x = -Math.PI / 2;
    startMesh.position.set(-96, 0.03, 76);
    scene.add(startMesh);

    // Zebra Pedestrian Crossing
    for (let i = -5; i <= 5; i += 2) {
      const zebra = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      zebra.rotation.x = -Math.PI / 2;
      zebra.position.set(-44 + i * 1.1, 0.03, 76);
      scene.add(zebra);
    }

    // 5.5 Physical 3D Estakada Ramp
    const estakadaGroup = new THREE.Group();
    // Ramp concrete material
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.65,
      metalness: 0.2,
    });
    const hazardBarMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
    });

    // Incline ramp
    const inclineGeo = new THREE.BoxGeometry(16, 2.4, 12);
    const inclineMesh = new THREE.Mesh(inclineGeo, rampMat);
    inclineMesh.position.set(-10, 1.2, 76);
    inclineMesh.rotation.z = 0.15; // Sloped up
    inclineMesh.castShadow = true;
    inclineMesh.receiveShadow = true;
    estakadaGroup.add(inclineMesh);

    // Elevated summit plateau
    const plateauGeo = new THREE.BoxGeometry(8, 2.4, 12);
    const plateauMesh = new THREE.Mesh(plateauGeo, rampMat);
    plateauMesh.position.set(2, 1.2, 76);
    plateauMesh.castShadow = true;
    plateauMesh.receiveShadow = true;
    estakadaGroup.add(plateauMesh);

    // Stop Line on Summit
    const estStopLine = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 11),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    estStopLine.rotation.x = -Math.PI / 2;
    estStopLine.position.set(0, 2.42, 76);
    estakadaGroup.add(estStopLine);

    // Decline ramp
    const declineGeo = new THREE.BoxGeometry(16, 2.4, 12);
    const declineMesh = new THREE.Mesh(declineGeo, rampMat);
    declineMesh.position.set(14, 1.2, 76);
    declineMesh.rotation.z = -0.15; // Sloped down
    declineMesh.castShadow = true;
    declineMesh.receiveShadow = true;
    estakadaGroup.add(declineMesh);

    // Safety guardrails on Estakada
    const railGeo = new THREE.BoxGeometry(40, 0.4, 0.3);
    const railLeft = new THREE.Mesh(railGeo, hazardBarMat);
    railLeft.position.set(2, 2.8, 70.2);
    estakadaGroup.add(railLeft);
    const railRight = new THREE.Mesh(railGeo, hazardBarMat);
    railRight.position.set(2, 2.8, 81.8);
    estakadaGroup.add(railRight);

    scene.add(estakadaGroup);

    // 5.6 Functional 3D Traffic Light at Intersection (X: 88, Z: -20)
    const trafficGroup = new THREE.Group();
    // Steel Pole Mast
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 9, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(80, 4.5, -20);
    pole.castShadow = true;
    trafficGroup.add(pole);

    // Overhead Arm
    const armGeo = new THREE.BoxGeometry(10, 0.3, 0.3);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(85, 8.8, -20);
    arm.castShadow = true;
    trafficGroup.add(arm);

    // Traffic Light Housing Box
    const tlBoxGeo = new THREE.BoxGeometry(1.2, 3.2, 1);
    const tlBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const tlBox = new THREE.Mesh(tlBoxGeo, tlBoxMat);
    tlBox.position.set(88, 7.2, -20);
    trafficGroup.add(tlBox);

    // 3 Lenses: Red, Yellow, Green
    const lensGeo = new THREE.SphereGeometry(0.35, 16, 16);

    const redMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.2,
    });
    trafficRedMatRef.current = redMat;
    const redLens = new THREE.Mesh(lensGeo, redMat);
    redLens.position.set(88, 8.2, -19.5);
    trafficGroup.add(redLens);

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 0.1,
    });
    trafficYellowMatRef.current = yellowMat;
    const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
    yellowLens.position.set(88, 7.2, -19.5);
    trafficGroup.add(yellowLens);

    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.5,
    });
    trafficGreenMatRef.current = greenMat;
    const greenLens = new THREE.Mesh(lensGeo, greenMat);
    greenLens.position.set(88, 6.2, -19.5);
    trafficGroup.add(greenLens);

    scene.add(trafficGroup);

    // 5.7 Railway Crossing with Tracks & St. Andrew's Cross (X: 30, Z: -66)
    const railwayGroup = new THREE.Group();
    // Steel rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 0.25), railMat);
    rail1.position.set(30, 0.1, -64.5);
    railwayGroup.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 0.25), railMat);
    rail2.position.set(30, 0.1, -67.5);
    railwayGroup.add(rail2);

    // Wooden sleepers / ties
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    for (let rx = 23; rx <= 37; rx += 1.4) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 4.5), tieMat);
      tie.position.set(rx, 0.05, -66);
      railwayGroup.add(tie);
    }

    // St. Andrew's Cross Sign
    const crossBarMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const crossBar1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.08), crossBarMat);
    crossBar1.rotation.z = Math.PI / 4;
    crossBar1.position.set(22, 3.8, -61);
    railwayGroup.add(crossBar1);
    const crossBar2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.08), crossBarMat);
    crossBar2.rotation.z = -Math.PI / 4;
    crossBar2.position.set(22, 3.8, -61);
    railwayGroup.add(crossBar2);

    scene.add(railwayGroup);

    // 5.8 3D Slalom Cones (Reflective Orange Rubber)
    const coneGeo = new THREE.ConeGeometry(0.6, 1.8, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const coneCoords: [number, number][] = [
      [58, 20],
      [66, 10],
      [74, 0],
      [82, -10],
    ];
    coneCoords.forEach(([cx, cz]) => {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(cx, 0.9, cz);
      cone.castShadow = true;
      scene.add(cone);
    });

    // 5.9 3D Examination Center Headquarters Building
    const hqGroup = new THREE.Group();
    // Building structure
    const bldGeo = new THREE.BoxGeometry(45, 12, 25);
    const bldMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.3,
    });
    const bldMesh = new THREE.Mesh(bldGeo, bldMat);
    bldMesh.position.set(0, 6, -135);
    bldMesh.castShadow = true;
    hqGroup.add(bldMesh);

    // Glass facade
    const glassGeo = new THREE.PlaneGeometry(38, 8);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 6, -122.4);
    hqGroup.add(glassMesh);

    // Roof Signage: "AVTODROM PRAVAONLINE / TOSHKENT VILOYATI IIV YHXX"
    const hqSignTex = createTextCanvasTexture(
      "AVTODROM PRAVAONLINE",
      512,
      128,
      "#0284c7",
      "#ffffff",
      38,
      "bold",
      "IIV YHXX RASMIY IMTIHON MARKAZI"
    );
    const hqSign = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 6),
      new THREE.MeshBasicMaterial({ map: hqSignTex })
    );
    hqSign.position.set(0, 15, -122);
    hqGroup.add(hqSign);

    scene.add(hqGroup);

    // 5.10 Low-poly Trees & Green Landscaping
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const foliageGeo = new THREE.DodecahedronGeometry(2.8, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const treePositions: [number, number][] = [
      [-120, -80],
      [-135, -40],
      [-125, 20],
      [-110, 80],
      [120, -70],
      [135, -20],
      [125, 50],
      [-40, -10],
      [30, 20],
    ];

    treePositions.forEach(([tx, tz]) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 4.8;
      foliage.castShadow = true;
      tree.add(foliage);

      tree.position.set(tx, 0, tz);
      scene.add(tree);
    });

    // =========================================================
    // 6. HIGH-DETAIL CHEVROLET COBALT 3D PROCEDURAL VEHICLE     //
    // =========================================================
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;

    // Metallic Cobalt Blue Paint
    const paintMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.75,
      roughness: 0.22,
    });

    // Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(4.45, 0.85, 1.8);
    const chassisMesh = new THREE.Mesh(chassisGeo, paintMat);
    chassisMesh.position.y = 0.65;
    chassisMesh.castShadow = true;
    vehicleGroup.add(chassisMesh);

    // Cabin / Roof Pillars & Dark Tinted Windows
    const cabinGeo = new THREE.BoxGeometry(2.4, 0.8, 1.55);
    const cabinMesh = new THREE.Mesh(cabinGeo, paintMat);
    cabinMesh.position.set(-0.15, 1.45, 0);
    cabinMesh.castShadow = true;
    vehicleGroup.add(cabinMesh);

    // Windshield & Glass (Tinted Translucent)
    const glassMatCobalt = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    // Front Windshield
    const wsGeo = new THREE.PlaneGeometry(1.48, 0.72);
    const windshield = new THREE.Mesh(wsGeo, glassMatCobalt);
    windshield.position.set(1.06, 1.45, 0);
    windshield.rotation.y = Math.PI / 2;
    windshield.rotation.x = -0.35;
    vehicleGroup.add(windshield);

    // Rear Windshield
    const rwsGeo = new THREE.PlaneGeometry(1.48, 0.72);
    const rearWindshield = new THREE.Mesh(rwsGeo, glassMatCobalt);
    rearWindshield.position.set(-1.36, 1.45, 0);
    rearWindshield.rotation.y = -Math.PI / 2;
    rearWindshield.rotation.x = -0.35;
    vehicleGroup.add(rearWindshield);

    // Front Grille & Chevrolet Golden Bowtie Emblem
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 1.1), grilleMat);
    grilleMesh.position.set(2.23, 0.65, 0);
    vehicleGroup.add(grilleMesh);

    // Chevrolet Bowtie (Gold)
    const bowtieMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const bowtieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.28), bowtieMat);
    bowtieMesh.position.set(2.28, 0.68, 0);
    vehicleGroup.add(bowtieMesh);

    // Uzbek License Plates (Front & Rear: "01 234 AAA")
    const plateTex = createUzbekLicensePlateTexture("01 234 AAA");
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });

    const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
    frontPlate.position.set(2.24, 0.38, 0);
    frontPlate.rotation.y = Math.PI / 2;
    vehicleGroup.add(frontPlate);

    const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
    rearPlate.position.set(-2.24, 0.45, 0);
    rearPlate.rotation.y = -Math.PI / 2;
    vehicleGroup.add(rearPlate);

    // Headlights (Clear Projector Lenses + SpotLights)
    const hlMeshGeo = new THREE.BoxGeometry(0.2, 0.24, 0.42);
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
    });
    const hlLeft = new THREE.Mesh(hlMeshGeo, hlMat);
    hlLeft.position.set(2.2, 0.72, 0.65);
    vehicleGroup.add(hlLeft);
    const hlRight = new THREE.Mesh(hlMeshGeo, hlMat);
    hlRight.position.set(2.2, 0.72, -0.65);
    vehicleGroup.add(hlRight);

    // Three.js SpotLight beam projections onto asphalt
    const spotL = new THREE.SpotLight(0xfffae6, 3, 40, Math.PI / 6, 0.4, 1);
    spotL.position.set(2.3, 0.75, 0.65);
    spotL.target.position.set(25, 0, 0.65);
    vehicleGroup.add(spotL);
    vehicleGroup.add(spotL.target);
    leftHeadlightSpotRef.current = spotL;

    const spotR = new THREE.SpotLight(0xfffae6, 3, 40, Math.PI / 6, 0.4, 1);
    spotR.position.set(2.3, 0.75, -0.65);
    spotR.target.position.set(25, 0, -0.65);
    vehicleGroup.add(spotR);
    vehicleGroup.add(spotR.target);
    rightHeadlightSpotRef.current = spotR;

    // Rear Taillights (Brake, Reverse, Turn Blinkers)
    const brakeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.4,
    });
    brakeLightMatRef.current = brakeMat;

    const reverseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0,
    });
    reverseLightMatRef.current = reverseMat;

    const tlGeo = new THREE.BoxGeometry(0.18, 0.22, 0.38);
    const tlLeft = new THREE.Mesh(tlGeo, brakeMat);
    tlLeft.position.set(-2.23, 0.72, 0.65);
    vehicleGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(tlGeo, brakeMat);
    tlRight.position.set(-2.23, 0.72, -0.65);
    vehicleGroup.add(tlRight);

    // Amber Turn Signal Markers
    const turnSigMatL = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
    });
    turnLeftLightMatRef.current = turnSigMatL;
    const turnMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), turnSigMatL);
    turnMeshL.position.set(-2.23, 0.72, 0.82);
    vehicleGroup.add(turnMeshL);

    const turnSigMatR = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
    });
    turnRightLightMatRef.current = turnSigMatR;
    const turnMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), turnSigMatR);
    turnMeshR.position.set(-2.23, 0.72, -0.82);
    vehicleGroup.add(turnMeshR);

    // 4 Wheels with Detailed Tires & Alloy Rims
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });

    const createWheelMesh = (): THREE.Mesh => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;

      // Inner silver alloy rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.33, 16), rimMat);
      tire.add(rim);
      return tire;
    };

    // Front Left Wheel with Steering Pivot Group
    const flSteer = new THREE.Group();
    flSteer.position.set(1.4, 0.42, 0.95);
    const flWheel = createWheelMesh();
    flSteer.add(flWheel);
    vehicleGroup.add(flSteer);
    frontLeftSteerRef.current = flSteer;
    frontLeftWheelMeshRef.current = flWheel;

    // Front Right Wheel with Steering Pivot Group
    const frSteer = new THREE.Group();
    frSteer.position.set(1.4, 0.42, -0.95);
    const frWheel = createWheelMesh();
    frSteer.add(frWheel);
    vehicleGroup.add(frSteer);
    frontRightSteerRef.current = frSteer;
    frontRightWheelMeshRef.current = frWheel;

    // Rear Wheels
    const rlWheel = createWheelMesh();
    rlWheel.position.set(-1.4, 0.42, 0.95);
    vehicleGroup.add(rlWheel);
    rearLeftWheelMeshRef.current = rlWheel;

    const rrWheel = createWheelMesh();
    rrWheel.position.set(-1.4, 0.42, -0.95);
    vehicleGroup.add(rrWheel);
    rearRightWheelMeshRef.current = rrWheel;

    scene.add(vehicleGroup);

    // =========================================================
    // 7. RENDER LOOP (60 FPS) WITH ANIMATION TICK                //
    // =========================================================
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Traffic Light Cycling Timer
      trafficLightTimerRef.current += delta;
      const cycleTime = trafficLightTimerRef.current % 18;
      if (cycleTime < 9) {
        // Green
        if (trafficGreenMatRef.current) trafficGreenMatRef.current.emissiveIntensity = 1.8;
        if (trafficYellowMatRef.current) trafficYellowMatRef.current.emissiveIntensity = 0.05;
        if (trafficRedMatRef.current) trafficRedMatRef.current.emissiveIntensity = 0.05;
      } else if (cycleTime < 11.5) {
        // Yellow
        if (trafficGreenMatRef.current) trafficGreenMatRef.current.emissiveIntensity = 0.05;
        if (trafficYellowMatRef.current) trafficYellowMatRef.current.emissiveIntensity = 1.8;
        if (trafficRedMatRef.current) trafficRedMatRef.current.emissiveIntensity = 0.05;
      } else {
        // Red
        if (trafficGreenMatRef.current) trafficGreenMatRef.current.emissiveIntensity = 0.05;
        if (trafficYellowMatRef.current) trafficYellowMatRef.current.emissiveIntensity = 0.05;
        if (trafficRedMatRef.current) trafficRedMatRef.current.emissiveIntensity = 1.8;
      }

      // Active Camera selection
      let activeCam: THREE.Camera = chaseCam;
      if (cameraView === "first_person") {
        activeCam = cockpitCam;
      } else if (cameraView === "top_down") {
        activeCam = topDownCam;
      }

      renderer.render(scene, activeCam);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      const asp = w / h;
      chaseCam.aspect = asp;
      chaseCam.updateProjectionMatrix();
      cockpitCam.aspect = asp;
      cockpitCam.updateProjectionMatrix();

      topDownCam.left = (frustumSize * asp) / -2;
      topDownCam.right = (frustumSize * asp) / 2;
      topDownCam.top = frustumSize / 2;
      topDownCam.bottom = frustumSize / -2;
      topDownCam.updateProjectionMatrix();

      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [cameraView]);

  // Synchronize Vehicle Position, Steering, Lights & Cameras with Telemetry
  useEffect(() => {
    const vehicle = vehicleGroupRef.current;
    if (!vehicle) return;

    // Convert 2D autodrome coordinates into 3D world space
    const worldX = (telemetry.posX - 300) * 0.4;
    const worldZ = (telemetry.posY - 250) * 0.4;
    const yaw = -telemetry.rotation;

    // Calculate physical Estakada elevation and pitch angle
    const { elevationY, pitch } = getElevationAndPitch(telemetry.posX, telemetry.posY);

    vehicle.position.set(worldX, elevationY, worldZ);
    vehicle.rotation.y = yaw;
    vehicle.rotation.z = pitch;

    // Ackermann Front Wheels Steering Angle Pivot
    const steerRad = (telemetry.steeringAngle * Math.PI) / 180;
    if (frontLeftSteerRef.current) frontLeftSteerRef.current.rotation.y = steerRad;
    if (frontRightSteerRef.current) frontRightSteerRef.current.rotation.y = steerRad;

    // Wheels Rolling Rotation with Speed
    const wheelRotDelta = telemetry.speed * 0.04;
    if (frontLeftWheelMeshRef.current) frontLeftWheelMeshRef.current.rotation.x += wheelRotDelta;
    if (frontRightWheelMeshRef.current) frontRightWheelMeshRef.current.rotation.x += wheelRotDelta;
    if (rearLeftWheelMeshRef.current) rearLeftWheelMeshRef.current.rotation.x += wheelRotDelta;
    if (rearRightWheelMeshRef.current) rearRightWheelMeshRef.current.rotation.x += wheelRotDelta;

    // Headlights SpotLight Intensity & Beam Projection
    const hlIntensity = telemetry.lowBeamsOn ? 3.5 : 0;
    if (leftHeadlightSpotRef.current) leftHeadlightSpotRef.current.intensity = hlIntensity;
    if (rightHeadlightSpotRef.current) rightHeadlightSpotRef.current.intensity = hlIntensity;

    // Brake Lights Flare
    if (brakeLightMatRef.current) {
      brakeLightMatRef.current.emissiveIntensity = telemetry.brake > 0.05 ? 2.5 : 0.4;
    }

    // Reverse Lights
    if (reverseLightMatRef.current) {
      reverseLightMatRef.current.emissiveIntensity = telemetry.gear === "R" ? 2.0 : 0;
    }

    // Turn Signal Amber Blinkers
    const isBlinking = Math.floor(Date.now() / 450) % 2 === 0;
    const isLeftOn = (telemetry.turnSignal === "left" || telemetry.turnSignal === "hazard") && isBlinking;
    const isRightOn = (telemetry.turnSignal === "right" || telemetry.turnSignal === "hazard") && isBlinking;

    if (turnLeftLightMatRef.current) {
      turnLeftLightMatRef.current.emissiveIntensity = isLeftOn ? 2.5 : 0;
    }
    if (turnRightLightMatRef.current) {
      turnRightLightMatRef.current.emissiveIntensity = isRightOn ? 2.5 : 0;
    }

    // Dynamic Camera Positions
    // 1. Chase Camera (Smooth 3rd person follow behind the car)
    if (chaseCameraRef.current) {
      const offsetDistance = 11.5;
      const offsetHeight = 4.6 + elevationY * 0.8;
      const camX = worldX - Math.cos(yaw) * offsetDistance;
      const camZ = worldZ - Math.sin(yaw) * offsetDistance;

      chaseCameraRef.current.position.set(camX, offsetHeight, camZ);
      chaseCameraRef.current.lookAt(worldX, elevationY + 1.2, worldZ);
    }

    // 2. Cockpit Camera (Driver POV from inside the Cobalt)
    if (cockpitCameraRef.current) {
      const driverEyeX = worldX + Math.cos(yaw) * 0.15;
      const driverEyeZ = worldZ + Math.sin(yaw) * 0.15;
      cockpitCameraRef.current.position.set(driverEyeX, elevationY + 1.35, driverEyeZ);

      const lookX = worldX + Math.cos(yaw) * 25;
      const lookZ = worldZ + Math.sin(yaw) * 25;
      cockpitCameraRef.current.lookAt(lookX, elevationY + 1.15, lookZ);
    }

    // 3. Top-Down Camera (Tracking directly above)
    if (topDownCameraRef.current) {
      topDownCameraRef.current.position.set(worldX, 150, worldZ);
      topDownCameraRef.current.lookAt(worldX, 0, worldZ);
    }
  }, [telemetry]);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      style={{
        width: "100%",
        height: "500px",
        minHeight: "440px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#1a2332",
        cursor: "pointer",
      }}
    />
  );
}
