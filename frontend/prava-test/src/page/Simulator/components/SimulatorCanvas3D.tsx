import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { VehicleTelemetry, ExerciseDefinition, CameraView, VehicleCategory } from "../types";
import { AUTODROME_SPEC } from "../registry/autodromeModel";
import { VehicleRenderer, type BuiltVehicleInstance } from "../engine/VehicleRenderer";
import { getVehicleConfig } from "../registry/vehicleConfigs";

interface Props {
  telemetry: VehicleTelemetry;
  exercise: ExerciseDefinition;
  cameraView: CameraView;
  showHelpers: boolean;
  onCanvasClick?: () => void;
  ghostTelemetry?: { posX: number; posY: number; rotation: number };
  idealTrajectory?: Array<{ x: number; y: number }>;
  historicalPath?: Array<{ x: number; y: number }>;
  category?: VehicleCategory;
  modelName?: string;
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
  ghostTelemetry,
  idealTrajectory,
  historicalPath,
  category,
  modelName,
}: Props) {
  const activeCategory = category || telemetry.category || "B";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const builtVehicleRef = useRef<BuiltVehicleInstance | null>(null);
  const currentBuiltVehicleKey = useRef<string>("");
  const cameraViewRef = useRef<CameraView>(cameraView);

  useEffect(() => {
    cameraViewRef.current = cameraView;
  }, [cameraView]);

  // Vehicle meshes and animation references
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const chassisGroupRef = useRef<THREE.Group | null>(null);
  const ghostVehicleGroupRef = useRef<THREE.Group | null>(null);
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
  const steeringWheelMeshRef = useRef<THREE.Mesh | null>(null);

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

  // Training Guide Line & Trajectory Meshes
  const guideLineMeshRef = useRef<THREE.Line | null>(null);
  const idealTrajectoryMeshRef = useRef<THREE.Line | null>(null);
  const historicalPathMeshRef = useRef<THREE.Line | null>(null);

  // Cameras
  const chaseCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cockpitCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rearCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
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

    const rearCam = new THREE.PerspectiveCamera(72, aspect, 0.1, 1000);
    rearCameraRef.current = rearCam;

    const frustumSize = 36;
    const topDownCam = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    topDownCam.position.set(0, 40, 0);
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
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
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

    // 7. Full Contiguous Arena Road Network generated from Single Source of Truth AUTODROME_SPEC
    // 10cm Yellow Sensor Boundary Markings Material
    const yellowSensorMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });

    AUTODROME_SPEC.roads.forEach((road) => {
      const p1 = AUTODROME_SPEC.to3D(road.start.x, road.start.y);
      const p2 = AUTODROME_SPEC.to3D(road.end.x, road.end.y);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.max(1, Math.hypot(dx, dz));
      const angle = Math.atan2(dz, dx);
      const roadW3D = road.width * AUTODROME_SPEC.dimensions.scale3D;

      const segmentGroup = new THREE.Group();
      segmentGroup.position.set(midX, 0.01, midZ);
      segmentGroup.rotation.y = -angle;

      // 7.1 Asphalt Segment
      const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(len, roadW3D), roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.receiveShadow = true;
      segmentGroup.add(roadMesh);

      // 7.2 Curbs on Left and Right borders
      if (road.hasCurbs) {
        const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(len, 0.35, 0.8), curbMat);
        curbLeft.position.set(0, 0.175, -roadW3D / 2 - 0.4);
        curbLeft.castShadow = true;
        curbLeft.receiveShadow = true;
        segmentGroup.add(curbLeft);

        const curbRight = new THREE.Mesh(new THREE.BoxGeometry(len, 0.35, 0.8), curbMat);
        curbRight.position.set(0, 0.175, roadW3D / 2 + 0.4);
        curbRight.castShadow = true;
        curbRight.receiveShadow = true;
        segmentGroup.add(curbRight);
      }

      // 7.3 Yellow 10cm Sensor Lines on borders
      if (road.hasYellowSensors) {
        const sensorL = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.1), yellowSensorMat);
        sensorL.rotation.x = -Math.PI / 2;
        sensorL.position.set(0, 0.012, -roadW3D / 2 + 0.15);
        segmentGroup.add(sensorL);

        const sensorR = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.1), yellowSensorMat);
        sensorR.rotation.x = -Math.PI / 2;
        sensorR.position.set(0, 0.012, roadW3D / 2 - 0.15);
        segmentGroup.add(sensorR);
      }

      // 7.4 Centerline
      if (road.hasCenterline) {
        const centerLine = new THREE.Mesh(
          new THREE.PlaneGeometry(len, 0.2),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.25 })
        );
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, 0.011, 0);
        segmentGroup.add(centerLine);
      }

      scene.add(segmentGroup);
    });

    // 7.5 Corner Junction Curbs & Connectors
    const createCornerJunction = (cx: number, cz: number, size: number) => {
      const jMesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), roadMat);
      jMesh.rotation.x = -Math.PI / 2;
      jMesh.position.set(cx, 0.01, cz);
      jMesh.receiveShadow = true;
      scene.add(jMesh);
    };
    createCornerJunction(28, 76, 16);
    createCornerJunction(52, 36, 16);
    createCornerJunction(52, -70, 16);
    createCornerJunction(-88, -70, 16);
    createCornerJunction(-88, 76, 16);

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
    // 12. HIGH-DETAIL 3D VEHICLE (Category B: Sedan / C: Truck / D: Bus)       //
    // =========================================================================    // 9. Procedural Vehicle Instance from VehicleRenderer
    const vConfig = getVehicleConfig(modelName || activeCategory);
    const vehicleInstance = VehicleRenderer.buildVehicle(scene, vConfig);
    builtVehicleRef.current = vehicleInstance;
    currentBuiltVehicleKey.current = `${vConfig.modelName}_${vConfig.category}`;

    vehicleGroupRef.current = vehicleInstance.vehicleGroup;
    chassisGroupRef.current = vehicleInstance.chassisGroup;
    frontLeftSteerRef.current = vehicleInstance.frontLeftSteer;
    frontRightSteerRef.current = vehicleInstance.frontRightSteer;
    frontLeftWheelMeshRef.current = vehicleInstance.frontLeftWheel;
    frontRightWheelMeshRef.current = vehicleInstance.frontRightWheel;
    rearLeftWheelMeshRef.current = vehicleInstance.rearLeftWheel;
    rearRightWheelMeshRef.current = vehicleInstance.rearRightWheel;
    steeringWheelMeshRef.current = vehicleInstance.steeringWheelMesh;
    leftHeadlightSpotRef.current = vehicleInstance.leftHeadlightSpot;
    rightHeadlightSpotRef.current = vehicleInstance.rightHeadlightSpot;
    brakeLightMatRef.current = vehicleInstance.brakeLightMat;
    reverseLightMatRef.current = vehicleInstance.reverseLightMat;
    turnLeftLightMatRef.current = vehicleInstance.turnLeftLightMat;
    turnRightLightMatRef.current = vehicleInstance.turnRightLightMat;

    // Ghost Hologram Vehicle for Training Mode & Replay Reference
    const ghostGroup = new THREE.Group();
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.45,
    });
    const ghostChassis = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.85, 1.8), ghostMat);
    ghostChassis.position.y = 0.65;
    ghostGroup.add(ghostChassis);
    const ghostCabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.55), ghostMat);
    ghostCabin.position.set(-0.15, 1.45, 0);
    ghostGroup.add(ghostCabin);
    ghostGroup.visible = false;
    scene.add(ghostGroup);
    ghostVehicleGroupRef.current = ghostGroup;

    // Ideal Trajectory Glowing Green Spline Line
    const trajMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    const trajLine = new THREE.Line(new THREE.BufferGeometry(), trajMat);
    trajLine.visible = false;
    scene.add(trajLine);
    idealTrajectoryMeshRef.current = trajLine;

    // Historical Driven Path Line (Orange/Red)
    const histMat = new THREE.LineBasicMaterial({
      color: 0xf97316,
      linewidth: 2,
      transparent: true,
      opacity: 0.75,
    });
    const histLine = new THREE.Line(new THREE.BufferGeometry(), histMat);
    histLine.visible = false;
    scene.add(histLine);
    historicalPathMeshRef.current = histLine;
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

      // Camera selection based on cameraViewRef
      const currentCam = cameraViewRef.current;
      let activeCam: THREE.Camera = chaseCam;
      if (currentCam === "first_person") {
        activeCam = cockpitCam;
      } else if (currentCam === "rear" && rearCameraRef.current) {
        activeCam = rearCameraRef.current;
      } else if (currentCam === "top_down") {
        activeCam = topDownCam;
      } else if (currentCam === "free" && freeCam) {
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
      if (cameraViewRef.current !== "free") return;
      isFreeCamDragging.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isFreeCamDragging.current || cameraViewRef.current !== "free") return;
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
      if (cameraViewRef.current !== "free") return;
      freeCamAngles.current.radius = Math.max(30, Math.min(220, freeCamAngles.current.radius + e.deltaY * 0.1));
    };

    // Touch support for free camera and canvas gestures on mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (cameraViewRef.current !== "free" || e.touches.length === 0) return;
      isFreeCamDragging.current = true;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isFreeCamDragging.current || cameraViewRef.current !== "free" || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - prevMousePos.current.x;
      const dy = e.touches[0].clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      freeCamAngles.current.theta -= dx * 0.008;
      freeCamAngles.current.phi = Math.max(0.15, Math.min(Math.PI / 2.2, freeCamAngles.current.phi - dy * 0.008));
    };
    const handleTouchEnd = () => {
      isFreeCamDragging.current = false;
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("wheel", handleWheel, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Responsive Resize Handler with ResizeObserver, fullscreenchange and window fallback
    const updateSize = () => {
      if (!container || !renderer) return;
      const isFs = typeof document !== "undefined" && !!document.fullscreenElement;
      const w = isFs ? window.innerWidth : (container.clientWidth || 900);
      const h = isFs ? window.innerHeight : (container.clientHeight || 550);
      if (w === 0 || h === 0) return;
      const asp = w / h;
      chaseCam.aspect = asp;
      chaseCam.updateProjectionMatrix();
      cockpitCam.aspect = asp;
      cockpitCam.updateProjectionMatrix();
      if (rearCameraRef.current) {
        rearCameraRef.current.aspect = asp;
        rearCameraRef.current.updateProjectionMatrix();
      }
      freeCam.aspect = asp;
      freeCam.updateProjectionMatrix();

      topDownCam.left = (frustumSize * asp) / -2;
      topDownCam.right = (frustumSize * asp) / 2;
      topDownCam.top = frustumSize / 2;
      topDownCam.bottom = frustumSize / -2;
      topDownCam.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(container);
    }
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);
    document.addEventListener("fullscreenchange", updateSize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
      document.removeEventListener("fullscreenchange", updateSize);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (builtVehicleRef.current) {
        builtVehicleRef.current.dispose();
        builtVehicleRef.current = null;
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Hot-swap 3D vehicle dynamically whenever modelName or activeCategory changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const vConfig = getVehicleConfig(modelName || activeCategory);
    const key = `${vConfig.modelName}_${vConfig.category}`;

    if (currentBuiltVehicleKey.current === key && builtVehicleRef.current) {
      return;
    }

    // Cleanly dispose prior vehicle meshes and materials from GPU memory
    if (builtVehicleRef.current) {
      builtVehicleRef.current.dispose();
      builtVehicleRef.current = null;
    }

    // Build replacement vehicle model with unique geometry, proportions and materials
    const vehicleInstance = VehicleRenderer.buildVehicle(scene, vConfig);
    builtVehicleRef.current = vehicleInstance;
    currentBuiltVehicleKey.current = key;

    vehicleGroupRef.current = vehicleInstance.vehicleGroup;
    chassisGroupRef.current = vehicleInstance.chassisGroup;
    frontLeftSteerRef.current = vehicleInstance.frontLeftSteer;
    frontRightSteerRef.current = vehicleInstance.frontRightSteer;
    frontLeftWheelMeshRef.current = vehicleInstance.frontLeftWheel;
    frontRightWheelMeshRef.current = vehicleInstance.frontRightWheel;
    rearLeftWheelMeshRef.current = vehicleInstance.rearLeftWheel;
    rearRightWheelMeshRef.current = vehicleInstance.rearRightWheel;
    steeringWheelMeshRef.current = vehicleInstance.steeringWheelMesh;
    leftHeadlightSpotRef.current = vehicleInstance.leftHeadlightSpot;
    rightHeadlightSpotRef.current = vehicleInstance.rightHeadlightSpot;
    brakeLightMatRef.current = vehicleInstance.brakeLightMat;
    reverseLightMatRef.current = vehicleInstance.reverseLightMat;
    turnLeftLightMatRef.current = vehicleInstance.turnLeftLightMat;
    turnRightLightMatRef.current = vehicleInstance.turnRightLightMat;
  }, [modelName, activeCategory]);

  // Synchronize Vehicle Position, Steering, Lights & Cameras with Telemetry
  useEffect(() => {
    const vehicle = vehicleGroupRef.current;
    if (!vehicle) return;

    // Convert 2D coordinates into 3D world space using Single Source of Truth
    const { x: worldX, z: worldZ } = AUTODROME_SPEC.to3D(telemetry.posX, telemetry.posY);
    const yaw = -telemetry.rotation;

    // Calculate physical Estakada elevation and pitch
    const { elevationY, pitch } = getElevationAndPitch(telemetry.posX, telemetry.posY);

    vehicle.position.set(worldX, elevationY, worldZ);
    vehicle.rotation.y = yaw;
    vehicle.rotation.z = pitch + (telemetry.pitch || 0);
    vehicle.rotation.x = telemetry.roll || 0;

    // Independent 4-Wheel Raycast Suspension Offsets
    if (telemetry.wheelHeights) {
      if (frontLeftSteerRef.current) frontLeftSteerRef.current.position.y = 0.42 + telemetry.wheelHeights[0];
      if (frontRightSteerRef.current) frontRightSteerRef.current.position.y = 0.42 + telemetry.wheelHeights[1];
      if (rearLeftWheelMeshRef.current) rearLeftWheelMeshRef.current.position.y = 0.42 + telemetry.wheelHeights[2];
      if (rearRightWheelMeshRef.current) rearRightWheelMeshRef.current.position.y = 0.42 + telemetry.wheelHeights[3];
    }

    // Ackermann Front Wheels Steering Angle Pivot (Left = -Z, Right = +Z in 3D world)
    const steerRad = (telemetry.steeringAngle * Math.PI) / 180;
    if (frontLeftSteerRef.current) frontLeftSteerRef.current.rotation.y = -steerRad;
    if (frontRightSteerRef.current) frontRightSteerRef.current.rotation.y = -steerRad;

    // Cockpit 3D Steering Wheel Rotation with Ackermann ratio (clockwise on steer right)
    if (steeringWheelMeshRef.current) {
      steeringWheelMeshRef.current.rotation.z = -steerRad * 2.8;
    }

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

    // Synchronize Ghost Hologram Vehicle
    if (ghostVehicleGroupRef.current) {
      if (ghostTelemetry) {
        const { x: gWorldX, z: gWorldZ } = AUTODROME_SPEC.to3D(ghostTelemetry.posX, ghostTelemetry.posY);
        const { elevationY: gElev } = getElevationAndPitch(ghostTelemetry.posX, ghostTelemetry.posY);
        ghostVehicleGroupRef.current.position.set(gWorldX, gElev, gWorldZ);
        ghostVehicleGroupRef.current.rotation.y = -ghostTelemetry.rotation;
        ghostVehicleGroupRef.current.visible = true;
      } else {
        ghostVehicleGroupRef.current.visible = false;
      }
    }

    // Synchronize Ideal Trajectory Glowing Ribbon
    if (idealTrajectoryMeshRef.current) {
      const pathPoints = idealTrajectory || exercise.helperPath;
      if (showHelpers && pathPoints && pathPoints.length > 1) {
        const points3D = pathPoints.map((p) => {
          const { x: px, z: pz } = AUTODROME_SPEC.to3D(p.x, p.y);
          const { elevationY: pElev } = getElevationAndPitch(p.x, p.y);
          return new THREE.Vector3(px, pElev + 0.12, pz);
        });
        idealTrajectoryMeshRef.current.geometry.setFromPoints(points3D);
        idealTrajectoryMeshRef.current.visible = true;
      } else {
        idealTrajectoryMeshRef.current.visible = false;
      }
    }

    // Synchronize Historical Driven Path Trail
    if (historicalPathMeshRef.current) {
      if (historicalPath && historicalPath.length > 1) {
        const histPoints = historicalPath.map((p) => {
          const { x: px, z: pz } = AUTODROME_SPEC.to3D(p.x, p.y);
          const { elevationY: pElev } = getElevationAndPitch(p.x, p.y);
          return new THREE.Vector3(px, pElev + 0.1, pz);
        });
        historicalPathMeshRef.current.geometry.setFromPoints(histPoints);
        historicalPathMeshRef.current.visible = true;
      } else {
        historicalPathMeshRef.current.visible = false;
      }
    }

    // Dynamic Camera Positions using vehicle-specific cameraOffsets
    const currentConfig = getVehicleConfig(modelName || activeCategory);
    const camOffsets = currentConfig.cameraOffsets;

    // 1. Chase Camera (High-Visibility Elevated 3rd-person view revealing the road ahead)
    if (chaseCameraRef.current) {
      const offsetDistance = camOffsets?.chaseDist ?? 8.2;
      const offsetHeight = (camOffsets?.chaseHeight ?? 4.2) + elevationY * 0.8;
      const camX = worldX - Math.cos(yaw) * offsetDistance;
      const camZ = worldZ + Math.sin(yaw) * offsetDistance;

      chaseCameraRef.current.position.set(camX, offsetHeight, camZ);
      const lookDist = 18.0;
      chaseCameraRef.current.lookAt(
        worldX + Math.cos(yaw) * lookDist,
        elevationY + 0.45,
        worldZ - Math.sin(yaw) * lookDist
      );
    }

    // 2. Cockpit Camera (Driver POV from inside cabin looking out windshield)
    if (cockpitCameraRef.current) {
      const eyeX = camOffsets?.cockpitEyeX ?? 0.15;
      const eyeY = camOffsets?.cockpitEyeY ?? 1.35;
      const eyeZ = camOffsets?.cockpitEyeZ ?? -0.28;
      const driverEyeX = worldX + eyeX * Math.cos(yaw) + eyeZ * Math.sin(yaw);
      const driverEyeZ = worldZ - eyeX * Math.sin(yaw) + eyeZ * Math.cos(yaw);
      cockpitCameraRef.current.position.set(driverEyeX, elevationY + eyeY, driverEyeZ);

      const lookDist = 25.0;
      const lookX = worldX + Math.cos(yaw) * lookDist;
      const lookZ = worldZ - Math.sin(yaw) * lookDist;
      cockpitCameraRef.current.lookAt(lookX, elevationY + eyeY * 0.85, lookZ);
    }

    // 3. Top-Down Camera (Orthographic high precision parking view)
    if (topDownCameraRef.current) {
      topDownCameraRef.current.up.set(0, 0, -1);
      topDownCameraRef.current.position.set(worldX, 40, worldZ);
      topDownCameraRef.current.lookAt(worldX, 0, worldZ);
    }

    // 4. Rear Camera (Backup wide-angle camera placed at rear bumper looking back)
    if (rearCameraRef.current) {
      const rearBumperDist = camOffsets?.rearBumperDist ?? (activeCategory === "D" ? 6.2 : activeCategory === "C" ? 4.8 : 2.5);
      const camX = worldX - Math.cos(yaw) * rearBumperDist;
      const camZ = worldZ + Math.sin(yaw) * rearBumperDist;
      rearCameraRef.current.position.set(camX, elevationY + 1.25, camZ);
      const lookDist = 20;
      rearCameraRef.current.lookAt(camX - Math.cos(yaw) * lookDist, elevationY + 0.3, camZ + Math.sin(yaw) * lookDist);
    }
  }, [telemetry, exercise, showHelpers, ghostTelemetry, idealTrajectory, historicalPath, activeCategory, modelName]);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "340px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#93c5fd",
        cursor: cameraView === "free" ? "grab" : "default",
      }}
    />
  );
}
