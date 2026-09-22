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
function createInWorldBadgeTexture(badgeNumber: number, title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Dark glassmorphic badge background
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath();
    ctx.roundRect(4, 4, 376, 88, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Left number badge
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.roundRect(14, 14, 68, 68, 10);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(badgeNumber), 48, 48);

    // Title
    ctx.font = "bold 26px sans-serif";
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
    // White background plate
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 64);

    // Black plate frame
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

// Helper: Yellow-and-Black checkered/striped curb texture matching screenshot
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

// Helper: Forward arrow on asphalt
function createForwardArrowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 128, 256);
    ctx.fillStyle = "#ffffff";
    // Arrow shaft
    ctx.fillRect(52, 90, 24, 130);
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(64, 25);
    ctx.lineTo(16, 95);
    ctx.lineTo(112, 95);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
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

    // Pedestrian symbol (black silhouette)
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
  const trafficGreenMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficYellowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficRedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trafficLightTimerRef = useRef<number>(0);

  // Cameras
  const chaseCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cockpitCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const topDownCameraRef = useRef<THREE.OrthographicCamera | null>(null);

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
    scene.background = new THREE.Color(0x93c5fd); // Daytime sky blue
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.0022);
    sceneRef.current = scene;

    // 2. Camera Setup
    const aspect = width / height;
    const chaseCam = new THREE.PerspectiveCamera(52, aspect, 0.1, 1000);
    chaseCameraRef.current = chaseCam;

    const cockpitCam = new THREE.PerspectiveCamera(62, aspect, 0.05, 1000);
    cockpitCameraRef.current = cockpitCam;

    const frustumSize = 140;
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

    // 3. WebGL Renderer with High Performance & Shadows
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
      console.warn("WebGLRenderer initialization failed", e);
      return;
    }

    // 4. Natural Daytime Lighting & Sun Shadows
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.85);
    hemiLight.position.set(0, 150, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(60, 120, 80);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    const d = 120;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // 5. Autodrome Ground & Environment Architecture
    // 5.1 Grass Terrain Base
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

    // 5.2 Yellow & Black Checkered Curbs matching screenshot
    const curbTex = createYellowBlackCurbTexture();
    const curbMat = new THREE.MeshStandardMaterial({
      map: curbTex,
      roughness: 0.6,
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

    // Track Straight Curbs (Left & Right of main track)
    createCurbBorder(180, 0.8, -10, 68.5);
    createCurbBorder(180, 0.8, -10, 83.5);

    // Outer autodrome boundary curbs
    createCurbBorder(360, 1.2, 0, -115);
    createCurbBorder(360, 1.2, 0, 115);
    createCurbBorder(1.2, 230, -180, 0);
    createCurbBorder(1.2, 230, 180, 0);

    // 5.3 Dark Asphalt Road Network
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

    // Main straight track
    createRoadSegment(180, 14, -10, 76);
    // Connecting circuits
    createRoadSegment(14, 160, 88, 0);
    createRoadSegment(160, 14, 10, -66);
    createRoadSegment(14, 150, -96, 6);

    // 5.4 Road Markings: Pavement "START" Text & Arrows right in front of vehicle
    const startTex = createTextCanvasTexture("START", 256, 128, "#00000000", "#f8fafc", 56);
    const startMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4),
      new THREE.MeshBasicMaterial({ map: startTex, transparent: true })
    );
    startMesh.rotation.x = -Math.PI / 2;
    startMesh.position.set(-82, 0.03, 76);
    scene.add(startMesh);

    // Pavement Forward Arrows on lane
    const arrowTex = createForwardArrowTexture();
    const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true });
    const arrow1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), arrowMat);
    arrow1.rotation.x = -Math.PI / 2;
    arrow1.rotation.z = -Math.PI / 2;
    arrow1.position.set(-68, 0.03, 76);
    scene.add(arrow1);

    // Zebra Pedestrian Crossing
    for (let i = -5; i <= 5; i += 2) {
      const zebra = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      zebra.rotation.x = -Math.PI / 2;
      zebra.position.set(-44 + i * 1.1, 0.03, 76);
      scene.add(zebra);
    }

    // 5.5 3D Floating In-World Waypoint Badges matching screenshot
    // Badge 2: "2 Piyodalar o'tish joyi" hovering over zebra crossing
    const badge2Tex = createInWorldBadgeTexture(2, "Piyodalar o'tish joyi");
    const badge2 = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 2),
      new THREE.MeshBasicMaterial({ map: badge2Tex, transparent: true, side: THREE.DoubleSide })
    );
    badge2.position.set(-44, 4.8, 76);
    scene.add(badge2);

    // Badge 3: "3 Estakada" hovering above ramp summit
    const badge3Tex = createInWorldBadgeTexture(3, "Estakada");
    const badge3 = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 1.8),
      new THREE.MeshBasicMaterial({ map: badge3Tex, transparent: true, side: THREE.DoubleSide })
    );
    badge3.position.set(0, 6.2, 76);
    scene.add(badge3);

    // 5.6 3D Traffic Light & Pedestrian Road Sign at Pedestrian Crossing
    const trafficGroup = new THREE.Group();
    // Steel Mast Pole
    const tlPoleGeo = new THREE.CylinderGeometry(0.18, 0.22, 7.5, 12);
    const tlPoleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 });
    const tlPole = new THREE.Mesh(tlPoleGeo, tlPoleMat);
    tlPole.position.set(-48, 3.75, 69.5);
    tlPole.castShadow = true;
    trafficGroup.add(tlPole);

    // Traffic Light Head Box
    const tlBoxGeo = new THREE.BoxGeometry(0.9, 2.6, 0.7);
    const tlBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const tlBox = new THREE.Mesh(tlBoxGeo, tlBoxMat);
    tlBox.position.set(-48, 6.2, 69.5);
    trafficGroup.add(tlBox);

    // 3 Lenses: Red, Yellow, Green
    const lensGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.1 });
    trafficRedMatRef.current = redMat;
    const redLens = new THREE.Mesh(lensGeo, redMat);
    redLens.position.set(-47.6, 7.0, 69.5);
    trafficGroup.add(redLens);

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.1 });
    trafficYellowMatRef.current = yellowMat;
    const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
    yellowLens.position.set(-47.6, 6.2, 69.5);
    trafficGroup.add(yellowLens);

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2.2 });
    trafficGreenMatRef.current = greenMat;
    const greenLens = new THREE.Mesh(lensGeo, greenMat);
    greenLens.position.set(-47.6, 5.4, 69.5);
    trafficGroup.add(greenLens);

    // Blue square pedestrian crossing road sign mounted on pole
    const pedSignTex = createPedestrianSignTexture();
    const pedSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: pedSignTex })
    );
    pedSignMesh.position.set(-47.8, 3.8, 69.5);
    pedSignMesh.rotation.y = Math.PI / 2;
    trafficGroup.add(pedSignMesh);

    scene.add(trafficGroup);

    // 5.7 Physical 3D Estakada Ramp directly ahead on the track
    const estakadaGroup = new THREE.Group();
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.65,
      metalness: 0.2,
    });
    const hazardBarMat = new THREE.MeshStandardMaterial({
      map: curbTex,
      roughness: 0.4,
    });

    // Incline ramp rising to summit
    const inclineGeo = new THREE.BoxGeometry(16, 2.5, 12);
    const inclineMesh = new THREE.Mesh(inclineGeo, rampMat);
    inclineMesh.position.set(-10, 1.25, 76);
    inclineMesh.rotation.z = 0.15; // Sloped up
    inclineMesh.castShadow = true;
    inclineMesh.receiveShadow = true;
    estakadaGroup.add(inclineMesh);

    // Elevated summit plateau
    const plateauGeo = new THREE.BoxGeometry(8, 2.5, 12);
    const plateauMesh = new THREE.Mesh(plateauGeo, rampMat);
    plateauMesh.position.set(2, 1.25, 76);
    plateauMesh.castShadow = true;
    plateauMesh.receiveShadow = true;
    estakadaGroup.add(plateauMesh);

    // Stop Line on Summit
    const estStopLine = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 11),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    estStopLine.rotation.x = -Math.PI / 2;
    estStopLine.position.set(0, 2.52, 76);
    estakadaGroup.add(estStopLine);

    // Decline ramp
    const declineGeo = new THREE.BoxGeometry(16, 2.5, 12);
    const declineMesh = new THREE.Mesh(declineGeo, rampMat);
    declineMesh.position.set(14, 1.25, 76);
    declineMesh.rotation.z = -0.15; // Sloped down
    declineMesh.castShadow = true;
    declineMesh.receiveShadow = true;
    estakadaGroup.add(declineMesh);

    // Safety guardrails with yellow-and-black hazard stripes
    const railGeo = new THREE.BoxGeometry(40, 0.5, 0.3);
    const railLeft = new THREE.Mesh(railGeo, hazardBarMat);
    railLeft.position.set(2, 2.9, 70.1);
    estakadaGroup.add(railLeft);
    const railRight = new THREE.Mesh(railGeo, hazardBarMat);
    railRight.position.set(2, 2.9, 81.9);
    estakadaGroup.add(railRight);

    scene.add(estakadaGroup);

    // 5.8 3D IIV YHXX Headquarters Building in the background
    const hqGroup = new THREE.Group();
    // Main building concrete structure
    const bldGeo = new THREE.BoxGeometry(50, 16, 26);
    const bldMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.25,
    });
    const bldMesh = new THREE.Mesh(bldGeo, bldMat);
    bldMesh.position.set(45, 8, 76);
    bldMesh.rotation.y = -Math.PI / 2;
    bldMesh.castShadow = true;
    hqGroup.add(bldMesh);

    // Blue glass curtain wall facade
    const glassGeo = new THREE.PlaneGeometry(42, 10);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(31.8, 8, 76);
    glassMesh.rotation.y = -Math.PI / 2;
    hqGroup.add(glassMesh);

    // Grand Signage: "IIV YHXX AVTODROM / DAVLAT IMTIHON MARKAZI"
    const hqSignTex = createTextCanvasTexture(
      "IIV YHXX AVTODROM",
      512,
      128,
      "#0369a1",
      "#ffffff",
      40,
      "bold",
      "DAVLAT IMTIHON MARKAZI"
    );
    const hqSign = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 5.5),
      new THREE.MeshBasicMaterial({ map: hqSignTex })
    );
    hqSign.position.set(31.6, 17, 76);
    hqSign.rotation.y = -Math.PI / 2;
    hqGroup.add(hqSign);

    // Checkpoint Security Booth on the right
    const boothGeo = new THREE.BoxGeometry(4.5, 3.5, 4.5);
    const boothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const booth = new THREE.Mesh(boothGeo, boothMat);
    booth.position.set(-20, 1.75, 89);
    booth.castShadow = true;
    hqGroup.add(booth);

    scene.add(hqGroup);

    // 5.9 3D Pine Trees & Conifers lining the autodrome
    const createPineTree = (px: number, pz: number) => {
      const tree = new THREE.Group();
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8), trunkMat);
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      tree.add(trunk);

      const needleMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
      // 3 Tiered Cones for realistic pine tree
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 8), needleMat);
      cone1.position.y = 4.2;
      cone1.castShadow = true;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.8, 8), needleMat);
      cone2.position.y = 5.8;
      cone2.castShadow = true;
      tree.add(cone2);

      const cone3 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 8), needleMat);
      cone3.position.y = 7.2;
      cone3.castShadow = true;
      tree.add(cone3);

      tree.position.set(px, 0, pz);
      scene.add(tree);
    };

    const treeCoords: [number, number][] = [
      [-75, 62],
      [-55, 62],
      [-35, 62],
      [-15, 62],
      [5, 62],
      [-75, 90],
      [-55, 90],
      [-35, 90],
      [-5, 90],
      [15, 90],
    ];
    treeCoords.forEach(([tx, tz]) => createPineTree(tx, tz));

    // 5.10 Dual-Lamp Stadium Floodlight Poles
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.28, 12, 10);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const lightPole1 = new THREE.Mesh(poleGeo, poleMat);
    lightPole1.position.set(-60, 6, 64);
    lightPole1.castShadow = true;
    scene.add(lightPole1);

    const lightPole2 = new THREE.Mesh(poleGeo, poleMat);
    lightPole2.position.set(-10, 6, 64);
    lightPole2.castShadow = true;
    scene.add(lightPole2);

    // =========================================================
    // 6. HIGH-DETAIL WHITE CHEVROLET COBALT 3D PROCEDURAL SEDAN  //
    // =========================================================
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;

    // Glossy White Metallic Car Paint matching screenshot
    const whitePaintMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.8,
      roughness: 0.18,
    });

    // Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(4.45, 0.85, 1.8);
    const chassisMesh = new THREE.Mesh(chassisGeo, whitePaintMat);
    chassisMesh.position.y = 0.65;
    chassisMesh.castShadow = true;
    vehicleGroup.add(chassisMesh);

    // Cabin / Pillars
    const cabinGeo = new THREE.BoxGeometry(2.4, 0.8, 1.55);
    const cabinMesh = new THREE.Mesh(cabinGeo, whitePaintMat);
    cabinMesh.position.set(-0.15, 1.45, 0);
    cabinMesh.castShadow = true;
    vehicleGroup.add(cabinMesh);

    // Tinted Glass
    const glassMatCobalt = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    // Front Windshield
    const wsGeo = new THREE.PlaneGeometry(1.48, 0.72);
    const windshield = new THREE.Mesh(wsGeo, glassMatCobalt);
    windshield.position.set(1.06, 1.45, 0);
    windshield.rotation.y = Math.PI / 2;
    windshield.rotation.x = -0.35;
    vehicleGroup.add(windshield);

    // Rear Windshield with High-Mount 3rd Brake Light
    const rearWindshield = new THREE.Mesh(wsGeo, glassMatCobalt);
    rearWindshield.position.set(-1.36, 1.45, 0);
    rearWindshield.rotation.y = -Math.PI / 2;
    rearWindshield.rotation.x = -0.35;
    vehicleGroup.add(rearWindshield);

    // Golden Chevrolet Bowtie Emblem on Trunk
    const bowtieMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const rearBowtie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.26), bowtieMat);
    rearBowtie.position.set(-2.24, 0.75, 0);
    vehicleGroup.add(rearBowtie);

    // Chrome "COBALT" script lettering on left of trunk
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const cobaltBadge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), chromeMat);
    cobaltBadge.position.set(-2.24, 0.72, 0.5);
    vehicleGroup.add(cobaltBadge);

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

    // Dual Taillight Clusters (Crimson Brake, Clear Reverse, Amber Turn)
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

    // Rear bumper dual red reflectors
    const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const refl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), reflectorMat);
    refl1.position.set(-2.24, 0.26, 0.65);
    vehicleGroup.add(refl1);
    const refl2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), reflectorMat);
    refl2.position.set(-2.24, 0.26, -0.65);
    vehicleGroup.add(refl2);

    // Headlights (Clear Projector Lenses + SpotLights)
    const hlMeshGeo = new THREE.BoxGeometry(0.2, 0.24, 0.42);
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });
    const hlLeft = new THREE.Mesh(hlMeshGeo, hlMat);
    hlLeft.position.set(2.2, 0.72, 0.65);
    vehicleGroup.add(hlLeft);
    const hlRight = new THREE.Mesh(hlMeshGeo, hlMat);
    hlRight.position.set(2.2, 0.72, -0.65);
    vehicleGroup.add(hlRight);

    // SpotLights projecting on road ahead
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

    // 4 Detailed Wheels with Tires & Alloy Rims
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

    // Front Wheels with Steer Pivots
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
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 550;
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

    // Dynamic Camera Positions matching screenshot
    // 1. Chase Camera (Smooth 3rd person follow behind car at trunk level)
    if (chaseCameraRef.current) {
      const offsetDistance = 9.8;
      const offsetHeight = 3.6 + elevationY * 0.8;
      const camX = worldX - Math.cos(yaw) * offsetDistance;
      const camZ = worldZ - Math.sin(yaw) * offsetDistance;

      chaseCameraRef.current.position.set(camX, offsetHeight, camZ);
      chaseCameraRef.current.lookAt(worldX + Math.cos(yaw) * 6, elevationY + 1.2, worldZ + Math.sin(yaw) * 6);
    }

    // 2. Cockpit Camera (Driver POV from inside cabin)
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
        height: "560px",
        minHeight: "480px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#93c5fd",
        cursor: "pointer",
      }}
    />
  );
}
