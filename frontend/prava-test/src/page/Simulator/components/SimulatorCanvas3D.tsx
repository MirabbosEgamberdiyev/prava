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
      ctx.fillText(text, width / 2, height * 0.38);
      ctx.font = `bold ${Math.round(fontSize * 0.45)}px sans-serif`;
      ctx.fillText(subText, width / 2, height * 0.72);
    } else {
      ctx.fillText(text, width / 2, height / 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

// Helper: Create 3D floating in-world exercise waypoint badge texture
function createInWorldBadgeTexture(badgeNumber: number, title: string, isActive: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Dark glassmorphic badge background
    ctx.fillStyle = isActive ? "rgba(14, 116, 144, 0.95)" : "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(4, 4, 376, 88, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = isActive ? "#38bdf8" : "#64748b";
    ctx.lineWidth = isActive ? 5 : 3;
    ctx.stroke();

    // Left number badge
    ctx.fillStyle = isActive ? "#0284c7" : "#334155";
    ctx.beginPath();
    ctx.roundRect(14, 14, 68, 68, 10);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(badgeNumber), 48, 48);

    // Title
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(title, 96, 48);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// Helper: Create Uzbek state license plate texture matching screenshot ("01 234 AAA")
function createUzbekLicensePlateTexture(numberStr: string = "01 234 AAA"): THREE.CanvasTexture {
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

    ctx.fillStyle = "#0099b5";
    ctx.fillRect(6, 6, 28, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("UZ", 20, 36);

    ctx.fillStyle = "#111111";
    ctx.font = "bold 32px 'DIN Alternate', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(numberStr, 142, 32);
  }
  return new THREE.CanvasTexture(canvas);
}

// Helper: Yellow-and-Black checkered curb texture
function createYellowBlackCurbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#facc15"; // Bright yellow
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = "#111827"; // Dark black
    ctx.fillRect(64, 0, 64, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 1);
  return tex;
}

// Helper: Chequered Finish Line Texture
function createChequeredFinishTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const size = 32;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#ffffff" : "#111827";
        ctx.fillRect(c * size, r * size, size, size);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// Helper: Speed Limit 30 km/h Sign Texture
function createSpeedLimit30Texture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("30", 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

// Helper: Railroad Crossbuck Texture
function createRailroadCrossbuckTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 120);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TEMIR YO'L", 128, 48);

    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("DIQQAT!", 128, 88);
  }
  return new THREE.CanvasTexture(canvas);
}

// Helper: Blue square pedestrian crossing road sign
function createPedestrianSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.roundRect(4, 4, 120, 120, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(64, 16);
    ctx.lineTo(16, 108);
    ctx.lineTo(112, 108);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(64, 46, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(60, 56, 8, 30);
    ctx.fillRect(52, 70, 24, 6);
  }
  return new THREE.CanvasTexture(canvas);
}

export default function SimulatorCanvas3D({
  telemetry,
  exercise,
  cameraView,
  showHelpers,
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

  // Dynamic Lighting & Materials
  const leftHeadlightSpotRef = useRef<THREE.SpotLight | null>(null);
  const rightHeadlightSpotRef = useRef<THREE.SpotLight | null>(null);
  const brakeLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const reverseLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const turnLeftLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const turnRightLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Traffic light dynamic lenses
  const trafficGreenMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficYellowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficRedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficLightTimerRef = useRef<number>(0);

  // Railway crossing flashing lights & barrier
  const railLight1MatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const railLight2MatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const railBarrierRef = useRef<THREE.Mesh | null>(null);

  // 12 Floating In-World Waypoint Badges
  const waypointBadgesRef = useRef<Map<number, THREE.Mesh>>(new Map());

  // Training Guide Line Spline
  const guideLineMeshRef = useRef<THREE.Line | null>(null);

  // Cameras
  const chaseCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cockpitCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const freeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const topDownCameraRef = useRef<THREE.OrthographicCamera | null>(null);

  // Free camera orbit controls state
  const isFreeCamDragging = useRef(false);
  const freeCamAngles = useRef({ theta: 0.8, phi: 0.6, radius: 120 });
  const prevMousePos = useRef({ x: 0, y: 0 });

  // Calculate Estakada ramp elevation and pitch
  const getElevationAndPitch = (x: number, y: number) => {
    // Estakada zone: X in [250, 350], Y in [410, 470]
    if (x >= 250 && x <= 350 && y >= 410 && y <= 470) {
      if (x <= 290) {
        const progress = (x - 250) / 40;
        return { elevationY: progress * 2.5, pitch: -0.16 };
      } else if (x <= 310) {
        return { elevationY: 2.5, pitch: 0 };
      } else {
        const progress = (x - 310) / 40;
        return { elevationY: (1 - progress) * 2.5, pitch: 0.16 };
      }
    }
    return { elevationY: 0, pitch: 0 };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 550;

    // 1. Scene setup with daytime sky and realistic atmospheric fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x93c5fd); // Sky blue
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.002);
    sceneRef.current = scene;

    // 2. Cameras
    const aspect = width / height;
    const chaseCam = new THREE.PerspectiveCamera(52, aspect, 0.1, 1000);
    chaseCameraRef.current = chaseCam;

    const cockpitCam = new THREE.PerspectiveCamera(62, aspect, 0.05, 1000);
    cockpitCameraRef.current = cockpitCam;

    const freeCam = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    freeCameraRef.current = freeCam;

    const frustumSize = 160;
    const topDownCam = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    topDownCam.position.set(0, 180, 0);
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
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.warn("WebGL initialization failed", e);
      return;
    }

    // 4. Natural Lighting & Sun Shadows
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.85);
    hemiLight.position.set(0, 150, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(80, 140, 90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 450;
    const d = 140;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // 5. Grass Terrain Base (500m x 450m)
    const grassGeo = new THREE.PlaneGeometry(500, 450);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a29,
      roughness: 0.9,
      metalness: 0.05,
    });
    const grassGround = new THREE.Mesh(grassGeo, grassMat);
    grassGround.rotation.x = -Math.PI / 2;
    grassGround.position.y = -0.05;
    grassGround.receiveShadow = true;
    scene.add(grassGround);

    // 6. Checkered Curbs & Asphalt Materials
    const curbTex = createYellowBlackCurbTexture();
    const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.6 });

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x272e39,
      roughness: 0.82,
      metalness: 0.12,
    });

    const createRoadSegment = (w: number, d: number, px: number, pz: number) => {
      const geo = new THREE.PlaneGeometry(w, d);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(px, 0.01, pz);
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    const createCurbBorder = (w: number, d: number, px: number, pz: number) => {
      const geo = new THREE.BoxGeometry(w, 0.35, d);
      const mesh = new THREE.Mesh(geo, curbMat);
      mesh.position.set(px, 0.175, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    // 7. Full Contiguous Arena Road Network (All 12 Stations connected)
    // 7.1 South Straight (Stations 1, 2, 3)
    createRoadSegment(200, 14, -20, 76);
    createCurbBorder(200, 0.8, -20, 68.5);
    createCurbBorder(200, 0.8, -20, 83.5);

    // 7.2 East Straight & Turns (Stations 4, 5, 6)
    createRoadSegment(14, 150, 52, 6);
    createCurbBorder(0.8, 150, 44.5, 6);
    createCurbBorder(0.8, 150, 59.5, 6);

    // 7.3 North Straight (Stations 7, 8, 9)
    createRoadSegment(180, 14, -20, -60);
    createCurbBorder(180, 0.8, -20, -52.5);
    createCurbBorder(180, 0.8, -20, -67.5);

    // 7.4 West Straight (Stations 10, 11, 12 & Loop into Start)
    createRoadSegment(14, 150, -92, 8);
    createCurbBorder(0.8, 150, -84.5, 8);
    createCurbBorder(0.8, 150, -99.5, 8);

    // 4 Connecting Curve Corners (Completing the continuous circuit)
    createRoadSegment(30, 30, 42, 66);
    createRoadSegment(30, 30, 42, -50);
    createRoadSegment(30, 30, -82, -50);
    createRoadSegment(30, 30, -82, 66);

    // =========================================================================
    // 8. PHYSICAL 3D OBJECTS FOR ALL 12 EXERCISE STATIONS                       //
    // =========================================================================

    // --- Station 1: START (worldX = -96, worldZ = 76) ---
    const startTex = createTextCanvasTexture("START", 256, 128, "#00000000", "#f8fafc", 56);
    const startMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: startTex, transparent: true }));
    startMesh.rotation.x = -Math.PI / 2;
    startMesh.position.set(-86, 0.03, 76);
    scene.add(startMesh);

    const startLine = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 13), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(-96, 0.03, 76);
    scene.add(startLine);

    // Checkpoint Security Booth
    const boothGeo = new THREE.BoxGeometry(4.5, 3.5, 4.5);
    const boothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const booth = new THREE.Mesh(boothGeo, boothMat);
    booth.position.set(-96, 1.75, 88);
    booth.castShadow = true;
    scene.add(booth);

    // --- Station 2: PEDESTRIAN CROSSING (worldX = -60, worldZ = 76) ---
    for (let i = -5; i <= 5; i += 2) {
      const zebra = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      zebra.rotation.x = -Math.PI / 2;
      zebra.position.set(-60 + i * 1.1, 0.03, 76);
      scene.add(zebra);
    }
    const pedStopLine = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    pedStopLine.rotation.x = -Math.PI / 2;
    pedStopLine.position.set(-70, 0.03, 76);
    scene.add(pedStopLine);

    // 3D Traffic Light & Pedestrian Sign
    const tlGroup = new THREE.Group();
    const tlPole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.5, 12), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 }));
    tlPole.position.set(-64, 3.75, 69.5);
    tlPole.castShadow = true;
    tlGroup.add(tlPole);

    const tlBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.7), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }));
    tlBox.position.set(-64, 6.2, 69.5);
    tlGroup.add(tlBox);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.1 });
    trafficRedMatRef.current = redMat;
    const redLens = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), redMat);
    redLens.position.set(-63.6, 7.0, 69.5);
    tlGroup.add(redLens);

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.1 });
    trafficYellowMatRef.current = yellowMat;
    const yellowLens = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), yellowMat);
    yellowLens.position.set(-63.6, 6.2, 69.5);
    tlGroup.add(yellowLens);

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2.2 });
    trafficGreenMatRef.current = greenMat;
    const greenLens = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), greenMat);
    greenLens.position.set(-63.6, 5.4, 69.5);
    tlGroup.add(greenLens);

    const pedSignMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: createPedestrianSignTexture() }));
    pedSignMesh.position.set(-63.8, 3.8, 69.5);
    pedSignMesh.rotation.y = Math.PI / 2;
    tlGroup.add(pedSignMesh);
    scene.add(tlGroup);

    // --- Station 3: 16% ESTAKADA PHYSICAL RAMP (worldX = -20 to 10, worldZ = 76) ---
    const estGroup = new THREE.Group();
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65, metalness: 0.2 });
    // Incline
    const inclineMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.5, 12), rampMat);
    inclineMesh.position.set(-16, 1.25, 76);
    inclineMesh.rotation.z = 0.15;
    inclineMesh.castShadow = true;
    inclineMesh.receiveShadow = true;
    estGroup.add(inclineMesh);

    // Summit Plateau with Stop Line
    const plateauMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 12), rampMat);
    plateauMesh.position.set(-4, 1.25, 76);
    plateauMesh.castShadow = true;
    plateauMesh.receiveShadow = true;
    estGroup.add(plateauMesh);

    const estStopLine = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 11), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    estStopLine.rotation.x = -Math.PI / 2;
    estStopLine.position.set(-5, 2.52, 76);
    estGroup.add(estStopLine);

    // Decline
    const declineMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.5, 12), rampMat);
    declineMesh.position.set(8, 1.25, 76);
    declineMesh.rotation.z = -0.15;
    declineMesh.castShadow = true;
    declineMesh.receiveShadow = true;
    estGroup.add(declineMesh);

    // Guardrails
    const railLeft = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 0.3), curbMat);
    railLeft.position.set(-4, 2.9, 70.1);
    estGroup.add(railLeft);
    const railRight = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 0.3), curbMat);
    railRight.position.set(-4, 2.9, 81.9);
    estGroup.add(railRight);
    scene.add(estGroup);

    // --- Station 4: 90° CORRIDOR TURNS (worldX = 28 to 52, worldZ = 72 to 36) ---
    // Corner apex bollards
    for (const [bx, bz] of [[32, 68], [44, 56], [36, 44], [48, 36]]) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      bollard.position.set(bx, 0.7, bz);
      bollard.castShadow = true;
      scene.add(bollard);
    }

    // --- Station 5: SLALOM (ZMEYKA) - 5 Realistic 3D Cones (worldX = 52, worldZ = 24 to -24) ---
    const coneOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });
    const coneWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    const create3DTrafficCone = (cx: number, cz: number) => {
      const coneGroup = new THREE.Group();
      // Base square
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), coneOrangeMat);
      base.position.y = 0.04;
      coneGroup.add(base);
      // Bottom cone
      const coneBtm = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 16), coneOrangeMat);
      coneBtm.position.y = 0.3;
      coneGroup.add(coneBtm);
      // Reflective white band
      const coneMid = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 16), coneWhiteMat);
      coneMid.position.y = 0.55;
      coneGroup.add(coneMid);
      // Cone top
      const coneTop = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 16), coneOrangeMat);
      coneTop.position.y = 0.85;
      coneGroup.add(coneTop);

      coneGroup.position.set(cx, 0, cz);
      coneGroup.castShadow = true;
      scene.add(coneGroup);
    };

    [-20, -10, 0, 10, 20].forEach((offsetZ) => create3DTrafficCone(52, offsetZ));

    // --- Station 6: SIGNALIZED 4-WAY INTERSECTION (worldX = 52, worldZ = -28) ---
    // Cross road intersecting East-West
    createRoadSegment(40, 14, 52, -28);

    // Stop lines for intersection
    const intStopLineS = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    intStopLineS.rotation.x = -Math.PI / 2;
    intStopLineS.position.set(52, 0.03, -18);
    scene.add(intStopLineS);

    // --- Station 7: 90° PERPENDICULAR GARAGE (worldX = 16, worldZ = -60) ---
    // Garage pocket (7m wide, 10m deep)
    createRoadSegment(10, 12, 16, -71);
    const garageWallMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    // Left wall
    const gWallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 12), garageWallMat);
    gWallL.position.set(10.8, 1.1, -71);
    gWallL.castShadow = true;
    scene.add(gWallL);
    // Right wall
    const gWallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 12), garageWallMat);
    gWallR.position.set(21.2, 1.1, -71);
    gWallR.castShadow = true;
    scene.add(gWallR);
    // Back wall & rubber wheel stopper
    const gWallB = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.2, 0.5), garageWallMat);
    gWallB.position.set(16, 1.1, -77.2);
    gWallB.castShadow = true;
    scene.add(gWallB);

    const gStopper = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    gStopper.position.set(16, 0.125, -75.8);
    scene.add(gStopper);

    // --- Station 8: RAILWAY LEVEL CROSSING (worldX = -40, worldZ = -60) ---
    // Physical steel rails crossing perpendicular to road
    const steelRailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });

    // Track 1 & 2 rails
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 28), steelRailMat);
    rail1.position.set(-39.2, 0.11, -60);
    scene.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 28), steelRailMat);
    rail2.position.set(-40.8, 0.11, -60);
    scene.add(rail2);

    // Wooden sleepers
    for (let s = -12; s <= 12; s += 1.8) {
      const slp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.4), sleeperMat);
      slp.position.set(-40, 0.07, -60 + s);
      scene.add(slp);
    }

    // St. Andrew's crossbuck sign & flashing lanterns
    const rxGroup = new THREE.Group();
    const rxPole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.5, 10), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    rxPole.position.set(-35, 2.75, -52);
    rxGroup.add(rxPole);

    const rxSign = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.8), new THREE.MeshBasicMaterial({ map: createRailroadCrossbuckTexture() }));
    rxSign.position.set(-35, 4.8, -52);
    rxSign.rotation.y = -Math.PI / 2;
    rxGroup.add(rxSign);

    const rxRedMat1 = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.2 });
    const rxRedMat2 = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.1 });
    railLight1MatRef.current = rxRedMat1;
    railLight2MatRef.current = rxRedMat2;

    const rxLight1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), rxRedMat1);
    rxLight1.position.set(-35, 3.8, -52.6);
    rxGroup.add(rxLight1);
    const rxLight2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), rxRedMat2);
    rxLight2.position.set(-35, 3.8, -51.4);
    rxGroup.add(rxLight2);

    // Striped Barrier Arm (Shlagbaum)
    const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 13), curbMat);
    barrierArm.position.set(-35.2, 1.2, -60);
    railBarrierRef.current = barrierArm;
    rxGroup.add(barrierArm);
    scene.add(rxGroup);

    // --- Station 9: ACCELERATION RUNWAY & RADAR (worldX = -84, worldZ = -60) ---
    // Speed limit 30 sign
    const spdSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: createSpeedLimit30Texture() }));
    spdSign.position.set(-78, 3.5, -52);
    spdSign.rotation.y = -Math.PI / 2;
    scene.add(spdSign);

    // 3D Radar Arch
    const radarArch = new THREE.Group();
    const rPoleL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 10), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    rPoleL.position.set(-84, 3.5, -52.5);
    radarArch.add(rPoleL);
    const rPoleR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 10), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    rPoleR.position.set(-84, 3.5, -67.5);
    radarArch.add(rPoleR);
    const rBeam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    rBeam.position.set(-84, 6.8, -60);
    radarArch.add(rBeam);
    const radarTex = createTextCanvasTexture("RADAR 30 km/h", 256, 64, "#0f172a", "#38bdf8", 32);
    const radarSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: radarTex }));
    radarSign.position.set(-83.6, 6.8, -60);
    radarSign.rotation.y = -Math.PI / 2;
    radarArch.add(radarSign);
    scene.add(radarArch);

    // --- Station 10: EMERGENCY BRAKING (worldX = -92, worldZ = -32) ---
    // Red striped hazard stop threshold
    const emgStop = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.6), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    emgStop.rotation.x = -Math.PI / 2;
    emgStop.position.set(-92, 0.03, -32);
    scene.add(emgStop);

    // --- Station 11: PARALLEL PARKING (worldX = -92, worldZ = 4) ---
    // Parking Bay (width 4.5m, length 12m)
    createRoadSegment(6, 14, -101, 4);
    const parkCurb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 14), curbMat);
    parkCurb.position.set(-104.2, 0.175, 4);
    scene.add(parkCurb);

    // 4 Reference corner bollards
    for (const [px, pz] of [[-98, -2], [-103, -2], [-98, 10], [-103, 10]]) {
      const pPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
      pPole.position.set(px, 0.8, pz);
      scene.add(pPole);
    }

    // --- Station 12: FINISH LINE & GRAND ARCH (worldX = -92, worldZ = 48) ---
    const finishCheqTex = createChequeredFinishTexture();
    const finishLine = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.4), new THREE.MeshBasicMaterial({ map: finishCheqTex }));
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(-92, 0.03, 48);
    scene.add(finishLine);

    // Grand Finish Gantry Arch
    const finArch = new THREE.Group();
    const fPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 8, 10), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    fPostL.position.set(-84.5, 4, 48);
    finArch.add(fPostL);
    const fPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 8, 10), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    fPostR.position.set(-99.5, 4, 48);
    finArch.add(fPostR);

    const fBeam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    fBeam.position.set(-92, 7.5, 48);
    finArch.add(fBeam);

    const finSignTex = createTextCanvasTexture("MARRA — FINISH", 512, 128, "#0284c7", "#ffffff", 48, "bold");
    const finSign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshBasicMaterial({ map: finSignTex }));
    finSign.position.set(-92, 7.5, 47.5);
    finArch.add(finSign);
    scene.add(finArch);

    // --- 9. 12 Floating In-World Waypoint Badges (Hovering 4.5m above each station) ---
    const waypointConfigs: [number, string, number, number][] = [
      [1, "START", -96, 76],
      [2, "Piyodalar o'tish joyi", -60, 76],
      [3, "Estakada", -4, 76],
      [4, "90° burilishlar", 42, 60],
      [5, "Slalom (Zmeyka)", 52, 0],
      [6, "Chorraha", 52, -28],
      [7, "Garaj", 16, -60],
      [8, "Temiryo'l", -40, -60],
      [9, "Tezlanish yo'lagi", -84, -60],
      [10, "Avariya to'xtash", -92, -32],
      [11, "Parallel parkovka", -92, 4],
      [12, "FINISH", -92, 48],
    ];

    waypointConfigs.forEach(([num, title, wx, wz]) => {
      const badgeTex = createInWorldBadgeTexture(num, title, num === exercise.number);
      const badgeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(7.5, 1.9),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, side: THREE.DoubleSide })
      );
      badgeMesh.position.set(wx, num === 3 ? 6.8 : 5.0, wz);
      scene.add(badgeMesh);
      waypointBadgesRef.current.set(num, badgeMesh);
    });

    // --- 10. Training Mode Ideal Trajectory Ribbon Spline ---
    const splinePoints: THREE.Vector3[] = [
      new THREE.Vector3(-96, 0.08, 76),
      new THREE.Vector3(-60, 0.08, 76),
      new THREE.Vector3(-16, 1.3, 76),
      new THREE.Vector3(-4, 2.55, 76),
      new THREE.Vector3(8, 1.3, 76),
      new THREE.Vector3(36, 0.08, 76),
      new THREE.Vector3(48, 0.08, 64),
      new THREE.Vector3(52, 0.08, 20),
      new THREE.Vector3(52, 0.08, -28),
      new THREE.Vector3(44, 0.08, -56),
      new THREE.Vector3(16, 0.08, -60),
      new THREE.Vector3(-40, 0.08, -60),
      new THREE.Vector3(-84, 0.08, -60),
      new THREE.Vector3(-92, 0.08, -32),
      new THREE.Vector3(-92, 0.08, 4),
      new THREE.Vector3(-92, 0.08, 48),
      new THREE.Vector3(-96, 0.08, 76),
    ];
    const curve = new THREE.CatmullRomCurve3(splinePoints);
    const curvePoints = curve.getPoints(200);
    const guideGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const guideMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const guideLine = new THREE.Line(guideGeo, guideMat);
    guideLine.visible = showHelpers;
    guideLineMeshRef.current = guideLine;
    scene.add(guideLine);

    // --- 11. Surrounding Architecture: Headquarters & Nature ---
    const hqGroup = new THREE.Group();
    const bldMesh = new THREE.Mesh(new THREE.BoxGeometry(45, 16, 24), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.25 }));
    bldMesh.position.set(0, 8, 112);
    bldMesh.castShadow = true;
    hqGroup.add(bldMesh);

    const hqSignTex = createTextCanvasTexture("IIV YHXX AVTODROM", 512, 128, "#0369a1", "#ffffff", 40, "bold", "DAVLAT IMTIHON MARKAZI");
    const hqSign = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.5), new THREE.MeshBasicMaterial({ map: hqSignTex }));
    hqSign.position.set(0, 16.5, 99.8);
    hqGroup.add(hqSign);
    scene.add(hqGroup);

    // Pine Trees
    const createPineTree = (px: number, pz: number) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }));
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      tree.add(trunk);

      const needleMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
      for (let c = 0; c < 3; c++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - c * 0.6, 3.0 - c * 0.4, 8), needleMat);
        cone.position.y = 4.0 + c * 1.5;
        cone.castShadow = true;
        tree.add(cone);
      }
      tree.position.set(px, 0, pz);
      scene.add(tree);
    };

    [
      [-75, 62], [-55, 62], [-35, 62], [-15, 62], [15, 62],
      [-75, 90], [-55, 90], [-35, 90], [-5, 90], [15, 90],
      [70, 20], [70, -10], [70, -40], [-115, 10], [-115, -20], [-115, -50],
    ].forEach(([tx, tz]) => createPineTree(tx, tz));

    // =========================================================================
    // 12. HIGH-DETAIL CHEVROLET COBALT 3D PROCEDURAL SEDAN                     //
    // =========================================================================
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;

    const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.18 });

    // Lower Chassis
    const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.85, 1.8), whitePaintMat);
    chassisMesh.position.y = 0.65;
    chassisMesh.castShadow = true;
    vehicleGroup.add(chassisMesh);

    // Cabin
    const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.55), whitePaintMat);
    cabinMesh.position.set(-0.15, 1.45, 0);
    cabinMesh.castShadow = true;
    vehicleGroup.add(cabinMesh);

    // Tinted Glass
    const glassMatCobalt = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.88 });
    const wsGeo = new THREE.PlaneGeometry(1.48, 0.72);
    const windshield = new THREE.Mesh(wsGeo, glassMatCobalt);
    windshield.position.set(1.06, 1.45, 0);
    windshield.rotation.y = Math.PI / 2;
    windshield.rotation.x = -0.35;
    vehicleGroup.add(windshield);

    const rearWindshield = new THREE.Mesh(wsGeo, glassMatCobalt);
    rearWindshield.position.set(-1.36, 1.45, 0);
    rearWindshield.rotation.y = -Math.PI / 2;
    rearWindshield.rotation.x = -0.35;
    vehicleGroup.add(rearWindshield);

    // Golden Chevrolet Bowtie & Chrome "COBALT" script
    const bowtieMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const rearBowtie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.26), bowtieMat);
    rearBowtie.position.set(-2.24, 0.75, 0);
    vehicleGroup.add(rearBowtie);

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const cobaltBadge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), chromeMat);
    cobaltBadge.position.set(-2.24, 0.72, 0.5);
    vehicleGroup.add(cobaltBadge);

    // License Plates ("01 234 AAA")
    const plateMat = new THREE.MeshBasicMaterial({ map: createUzbekLicensePlateTexture("01 234 AAA") });
    const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
    frontPlate.position.set(2.24, 0.38, 0);
    frontPlate.rotation.y = Math.PI / 2;
    vehicleGroup.add(frontPlate);

    const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), plateMat);
    rearPlate.position.set(-2.24, 0.45, 0);
    rearPlate.rotation.y = -Math.PI / 2;
    vehicleGroup.add(rearPlate);

    // Taillight Clusters (Brake, Reverse, Turn)
    const brakeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.4 });
    brakeLightMatRef.current = brakeMat;
    const reverseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 });
    reverseLightMatRef.current = reverseMat;

    const tlGeo = new THREE.BoxGeometry(0.18, 0.22, 0.38);
    const tlLeft = new THREE.Mesh(tlGeo, brakeMat);
    tlLeft.position.set(-2.23, 0.72, 0.65);
    vehicleGroup.add(tlLeft);
    const tlRight = new THREE.Mesh(tlGeo, brakeMat);
    tlRight.position.set(-2.23, 0.72, -0.65);
    vehicleGroup.add(tlRight);

    // Amber Turn Signals
    const turnSigMatL = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0 });
    turnLeftLightMatRef.current = turnSigMatL;
    const turnMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), turnSigMatL);
    turnMeshL.position.set(-2.23, 0.72, 0.82);
    vehicleGroup.add(turnMeshL);

    const turnSigMatR = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0 });
    turnRightLightMatRef.current = turnSigMatR;
    const turnMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), turnSigMatR);
    turnMeshR.position.set(-2.23, 0.72, -0.82);
    vehicleGroup.add(turnMeshR);

    // Headlights (Projectors + SpotLights)
    const hlMeshGeo = new THREE.BoxGeometry(0.2, 0.24, 0.42);
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });
    const hlLeft = new THREE.Mesh(hlMeshGeo, hlMat);
    hlLeft.position.set(2.2, 0.72, 0.65);
    vehicleGroup.add(hlLeft);
    const hlRight = new THREE.Mesh(hlMeshGeo, hlMat);
    hlRight.position.set(2.2, 0.72, -0.65);
    vehicleGroup.add(hlRight);

    const spotL = new THREE.SpotLight(0xfffae6, 3.5, 45, Math.PI / 6, 0.4, 1);
    spotL.position.set(2.3, 0.75, 0.65);
    spotL.target.position.set(25, 0, 0.65);
    vehicleGroup.add(spotL);
    vehicleGroup.add(spotL.target);
    leftHeadlightSpotRef.current = spotL;

    const spotR = new THREE.SpotLight(0xfffae6, 3.5, 45, Math.PI / 6, 0.4, 1);
    spotR.position.set(2.3, 0.75, -0.65);
    spotR.target.position.set(25, 0, -0.65);
    vehicleGroup.add(spotR);
    vehicleGroup.add(spotR.target);
    rightHeadlightSpotRef.current = spotR;

    // 4 Wheels & Tires
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });

    const createWheelMesh = (): THREE.Mesh => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.33, 16), rimMat);
      tire.add(rim);
      return tire;
    };

    const flSteer = new THREE.Group();
    flSteer.position.set(1.4, 0.42, 0.95);
    const flWheel = createWheelMesh();
    flSteer.add(flWheel);
    vehicleGroup.add(flSteer);
    frontLeftSteerRef.current = flSteer;
    frontLeftWheelMeshRef.current = flWheel;

    const frSteer = new THREE.Group();
    frSteer.position.set(1.4, 0.42, -0.95);
    const frWheel = createWheelMesh();
    frSteer.add(frWheel);
    vehicleGroup.add(frSteer);
    frontRightSteerRef.current = frSteer;
    frontRightWheelMeshRef.current = frWheel;

    const rlWheel = createWheelMesh();
    rlWheel.position.set(-1.4, 0.42, 0.95);
    vehicleGroup.add(rlWheel);
    rearLeftWheelMeshRef.current = rlWheel;

    const rrWheel = createWheelMesh();
    rrWheel.position.set(-1.4, 0.42, -0.95);
    vehicleGroup.add(rrWheel);
    rearRightWheelMeshRef.current = rrWheel;

    scene.add(vehicleGroup);

    // =========================================================================
    // 13. RENDER LOOP (60 FPS) WITH ANIMATIONS & FREE-CAM LISTENERS            //
    // =========================================================================
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Traffic Light Cycle
      trafficLightTimerRef.current += delta;
      const cycleTime = trafficLightTimerRef.current % 18;
      if (cycleTime < 10) {
        if (trafficGreenMatRef.current) trafficGreenMatRef.current.emissiveIntensity = 2.2;
        if (trafficYellowMatRef.current) trafficYellowMatRef.current.emissiveIntensity = 0.05;
        if (trafficRedMatRef.current) trafficRedMatRef.current.emissiveIntensity = 0.05;
      } else if (cycleTime < 12.5) {
        if (trafficGreenMatRef.current) trafficGreenMatRef.current.emissiveIntensity = 0.05;
        if (trafficYellowMatRef.current) trafficYellowMatRef.current.emissiveIntensity = 2.0;
        if (trafficRedMatRef.current) trafficRedMatRef.current.emissiveIntensity = 0.05;
      } else {
        if (trafficGreenMatRef.current) trafficGreenMatRef.current.emissiveIntensity = 0.05;
        if (trafficYellowMatRef.current) trafficYellowMatRef.current.emissiveIntensity = 0.05;
        if (trafficRedMatRef.current) trafficRedMatRef.current.emissiveIntensity = 2.0;
      }

      // Railway Crossing Alternating Red Flash
      const railBlink = Math.floor(trafficLightTimerRef.current * 2) % 2 === 0;
      if (railLight1MatRef.current) railLight1MatRef.current.emissiveIntensity = railBlink ? 2.2 : 0.1;
      if (railLight2MatRef.current) railLight2MatRef.current.emissiveIntensity = !railBlink ? 2.2 : 0.1;

      // Waypoint badges hover float animation
      const hoverY = Math.sin(clock.getElapsedTime() * 2.5) * 0.25;
      waypointBadgesRef.current.forEach((badge, num) => {
        const baseY = num === 3 ? 6.8 : 5.0;
        badge.position.y = baseY + hoverY;
      });

      // Camera selection
      let activeCam: THREE.Camera = chaseCam;
      if (cameraView === "first_person") {
        activeCam = cockpitCam;
      } else if (cameraView === "top_down") {
        activeCam = topDownCam;
      } else if (cameraView === "free" && freeCam) {
        const { theta, phi, radius } = freeCamAngles.current;
        const target = vehicleGroupRef.current?.position || new THREE.Vector3();
        freeCam.position.set(
          target.x + radius * Math.sin(phi) * Math.cos(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.sin(theta)
        );
        freeCam.lookAt(target);
        activeCam = freeCam;
      }

      renderer.render(scene, activeCam);
    };
    animate();

    // Free camera mouse drag listeners
    const handleMouseDown = (e: MouseEvent) => {
      if (cameraView !== "free") return;
      isFreeCamDragging.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isFreeCamDragging.current || cameraView !== "free") return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      freeCamAngles.current.theta -= dx * 0.008;
      freeCamAngles.current.phi = Math.max(0.15, Math.min(Math.PI / 2.2, freeCamAngles.current.phi - dy * 0.008));
    };
    const handleMouseUp = () => {
      isFreeCamDragging.current = false;
    };
    const handleWheel = (e: WheelEvent) => {
      if (cameraView !== "free") return;
      freeCamAngles.current.radius = Math.max(30, Math.min(220, freeCamAngles.current.radius + e.deltaY * 0.1));
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("wheel", handleWheel, { passive: true });

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 550;
      const asp = w / h;
      chaseCam.aspect = asp;
      chaseCam.updateProjectionMatrix();
      cockpitCam.aspect = asp;
      cockpitCam.updateProjectionMatrix();
      freeCam.aspect = asp;
      freeCam.updateProjectionMatrix();

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
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
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

    // Convert 2D coordinates into 3D world space
    const worldX = (telemetry.posX - 300) * 0.4;
    const worldZ = (telemetry.posY - 250) * 0.4;
    const yaw = -telemetry.rotation;

    // Calculate physical Estakada elevation and pitch
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

    // Headlights SpotLight Intensity
    const hlIntensity = telemetry.lowBeamsOn ? 3.8 : 0;
    if (leftHeadlightSpotRef.current) leftHeadlightSpotRef.current.intensity = hlIntensity;
    if (rightHeadlightSpotRef.current) rightHeadlightSpotRef.current.intensity = hlIntensity;

    // Brake Lights Flare
    if (brakeLightMatRef.current) {
      brakeLightMatRef.current.emissiveIntensity = telemetry.brake > 0.05 ? 2.6 : 0.4;
    }

    // Reverse Lights
    if (reverseLightMatRef.current) {
      reverseLightMatRef.current.emissiveIntensity = telemetry.gear === "R" ? 2.2 : 0;
    }

    // Turn Signal Amber Blinkers
    const isBlinking = Math.floor(Date.now() / 450) % 2 === 0;
    const isLeftOn = (telemetry.turnSignal === "left" || telemetry.turnSignal === "hazard") && isBlinking;
    const isRightOn = (telemetry.turnSignal === "right" || telemetry.turnSignal === "hazard") && isBlinking;

    if (turnLeftLightMatRef.current) turnLeftLightMatRef.current.emissiveIntensity = isLeftOn ? 2.5 : 0;
    if (turnRightLightMatRef.current) turnRightLightMatRef.current.emissiveIntensity = isRightOn ? 2.5 : 0;

    // Highlight active waypoint badge
    waypointBadgesRef.current.forEach((badge, num) => {
      const active = num === exercise.number;
      badge.scale.set(active ? 1.15 : 1.0, active ? 1.15 : 1.0, 1.0);
    });

    // Toggle Training Guide Line Visibility
    if (guideLineMeshRef.current) {
      guideLineMeshRef.current.visible = showHelpers;
    }

    // Dynamic Camera Positions
    // 1. Chase Camera (Smooth 3rd person follow behind car)
    if (chaseCameraRef.current) {
      const offsetDistance = 9.8;
      const offsetHeight = 3.6 + elevationY * 0.8;
      const camX = worldX - Math.cos(yaw) * offsetDistance;
      const camZ = worldZ - Math.sin(yaw) * offsetDistance;

      chaseCameraRef.current.position.set(camX, offsetHeight, camZ);
      chaseCameraRef.current.lookAt(worldX + Math.cos(yaw) * 6, elevationY + 1.2, worldZ + Math.sin(yaw) * 6);
    }

    // 2. Cockpit Camera (Driver POV from inside cabin looking out windshield)
    if (cockpitCameraRef.current) {
      const driverEyeX = worldX + Math.cos(yaw) * 0.15;
      const driverEyeZ = worldZ + Math.sin(yaw) * 0.15;
      cockpitCameraRef.current.position.set(driverEyeX, elevationY + 1.35, driverEyeZ);

      const lookX = worldX + Math.cos(yaw) * 25;
      const lookZ = worldZ + Math.sin(yaw) * 25;
      cockpitCameraRef.current.lookAt(lookX, elevationY + 1.15, lookZ);
    }

    // 3. Top-Down Camera
    if (topDownCameraRef.current) {
      topDownCameraRef.current.position.set(worldX, 160, worldZ);
      topDownCameraRef.current.lookAt(worldX, 0, worldZ);
    }
  }, [telemetry, exercise, showHelpers]);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      style={{
        width: "100%",
        height: "560px",
        minHeight: "480px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#93c5fd",
        cursor: cameraView === "free" ? "grab" : "default",
      }}
    />
  );
}
