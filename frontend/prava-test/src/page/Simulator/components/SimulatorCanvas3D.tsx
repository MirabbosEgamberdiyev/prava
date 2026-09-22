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
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Cameras
  const chaseCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cockpitCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const topDownCameraRef = useRef<THREE.OrthographicCamera | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a252f);
    scene.fog = new THREE.Fog(0x1a252f, 150, 450);
    sceneRef.current = scene;

    // 2. Setup Cameras
    const aspect = width / height;
    const chaseCam = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    chaseCameraRef.current = chaseCam;

    const cockpitCam = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    cockpitCameraRef.current = cockpitCam;

    const frustumSize = 120;
    const topDownCam = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    topDownCam.position.set(0, 150, 0);
    topDownCam.lookAt(0, 0, 0);
    topDownCameraRef.current = topDownCam;

    // 3. Setup WebGL Renderer
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
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.warn("Three.js WebGLRenderer could not be initialized", e);
      return;
    }

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.75);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(80, 150, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const d = 120;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 5. Track Ground (Asphalt)
    const groundGeo = new THREE.PlaneGeometry(350, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2b303a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Track Perimeter Walls (Red/White Curbs)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xc0392b });
    const wallGeoX = new THREE.BoxGeometry(350, 1.5, 2);
    const wallTop = new THREE.Mesh(wallGeoX, wallMat);
    wallTop.position.set(0, 0.75, -148);
    scene.add(wallTop);

    const wallBottom = new THREE.Mesh(wallGeoX, wallMat);
    wallBottom.position.set(0, 0.75, 148);
    scene.add(wallBottom);

    const wallGeoZ = new THREE.BoxGeometry(2, 1.5, 300);
    const wallLeft = new THREE.Mesh(wallGeoZ, wallMat);
    wallLeft.position.set(-173, 0.75, 0);
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(wallGeoZ, wallMat);
    wallRight.position.set(173, 0.75, 0);
    scene.add(wallRight);

    // Stop line geometry
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineGeo = new THREE.PlaneGeometry(16, 1.2);
    const stopLine = new THREE.Mesh(lineGeo, lineMat);
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.set(0, 0.02, 30);
    scene.add(stopLine);

    // Cones
    const coneGeo = new THREE.ConeGeometry(0.7, 2, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.4 });
    const conePositions = [
      [-15, 0],
      [-5, -15],
      [5, -30],
      [15, -45],
      [-15, -60],
    ];
    conePositions.forEach(([cx, cz]) => {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(cx, 1, cz);
      cone.castShadow = true;
      scene.add(cone);
    });

    // 6. Chevrolet Cobalt Vehicle 3D Model
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;

    // Body Chassis
    const bodyGeo = new THREE.BoxGeometry(4.4, 1.2, 1.9);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e3799,
      roughness: 0.3,
      metalness: 0.6,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    vehicleGroup.add(bodyMesh);

    // Cabin Roof & Glass
    const cabinGeo = new THREE.BoxGeometry(2.3, 0.9, 1.6);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x82ccdd,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(-0.2, 1.7, 0);
    cabinMesh.castShadow = true;
    vehicleGroup.add(cabinMesh);

    // Headlights (White/Yellow Spotlights)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xf6e58d });
    const hlGeo = new THREE.BoxGeometry(0.2, 0.25, 0.4);
    const hlLeft = new THREE.Mesh(hlGeo, lightMat);
    hlLeft.position.set(2.2, 0.85, 0.65);
    vehicleGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, lightMat);
    hlRight.position.set(2.2, 0.85, -0.65);
    vehicleGroup.add(hlRight);

    // Taillights (Red)
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xeb2f06 });
    const tlLeft = new THREE.Mesh(hlGeo, tlMat);
    tlLeft.position.set(-2.2, 0.85, 0.65);
    vehicleGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(hlGeo, tlMat);
    tlRight.position.set(-2.2, 0.85, -0.65);
    vehicleGroup.add(tlRight);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wheelPositions = [
      [1.4, 0.45, 0.95],
      [1.4, 0.45, -0.95],
      [-1.4, 0.45, 0.95],
      [-1.4, 0.45, -0.95],
    ];
    const wheelsList: THREE.Mesh[] = [];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      vehicleGroup.add(wheel);
      wheelsList.push(wheel);
    });
    wheelsRef.current = wheelsList;

    scene.add(vehicleGroup);

    // 7. Render Loop (60 FPS)
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Select active camera
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

    // Cleanup on unmount
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

  // Update vehicle position, rotation, and camera in scene based on telemetry
  useEffect(() => {
    const vehicle = vehicleGroupRef.current;
    if (!vehicle) return;

    // Convert 2D canvas coordinates (0..600, 0..500) into 3D world space coordinates
    const worldX = (telemetry.posX - 300) * 0.4;
    const worldZ = (telemetry.posY - 250) * 0.4;
    const yaw = -telemetry.rotation;

    vehicle.position.set(worldX, 0, worldZ);
    vehicle.rotation.y = yaw;

    // Rotate wheels
    const wheelRotDelta = (telemetry.speed * 0.05);
    wheelsRef.current.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    // Update Chase Camera position
    if (chaseCameraRef.current) {
      const offsetDistance = 14;
      const offsetHeight = 6.5;
      const camX = worldX - Math.cos(yaw) * offsetDistance;
      const camZ = worldZ - Math.sin(yaw) * offsetDistance;
      chaseCameraRef.current.position.set(camX, offsetHeight, camZ);
      chaseCameraRef.current.lookAt(worldX, 1.2, worldZ);
    }

    // Update Cockpit Camera position
    if (cockpitCameraRef.current) {
      const driverEyeX = worldX + Math.cos(yaw) * 0.1;
      const driverEyeZ = worldZ + Math.sin(yaw) * 0.1;
      cockpitCameraRef.current.position.set(driverEyeX, 1.6, driverEyeZ);
      const lookTargetX = worldX + Math.cos(yaw) * 20;
      const lookTargetZ = worldZ + Math.sin(yaw) * 20;
      cockpitCameraRef.current.lookAt(lookTargetX, 1.4, lookTargetZ);
    }

    // Update Top-down camera focus
    if (topDownCameraRef.current) {
      topDownCameraRef.current.position.set(worldX, 120, worldZ);
      topDownCameraRef.current.lookAt(worldX, 0, worldZ);
    }
  }, [telemetry]);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      style={{
        width: "100%",
        height: "480px",
        minHeight: "420px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#1a252f",
        cursor: "pointer",
      }}
    />
  );
}
