import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  RotateCw,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ZoomIn,
} from "lucide-react";

export interface AuctionGavelSceneProps {
  className?: string;
}

type FinishMode = "gold_mahogany" | "titanium_walnut" | "bronze_antique";
type CameraView = "overview" | "gavel" | "pedestal";

export const AuctionGavelScene: React.FC<AuctionGavelSceneProps> = ({
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeFinish, setActiveFinish] = useState<FinishMode>("gold_mahogany");
  const [activeView, setActiveView] = useState<CameraView>("overview");
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isGpuAccelerated, setIsGpuAccelerated] = useState(true);

  // References to keep animation loop & controls reactive
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gavelMeshGroupRef = useRef<THREE.Group | null>(null);
  const pedestalMeshGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<{
    [key: string]: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
  }>({});
  const isRotatingRef = useRef(isAutoRotating);
  const targetCameraPosRef = useRef(new THREE.Vector3(0, 1.6, 3.8));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0.4, 0));

  useEffect(() => {
    isRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Update camera target view
  useEffect(() => {
    if (activeView === "overview") {
      targetCameraPosRef.current.set(0, 1.6, 3.8);
      targetLookAtRef.current.set(0, 0.4, 0);
    } else if (activeView === "gavel") {
      targetCameraPosRef.current.set(0.6, 1.2, 2.2);
      targetLookAtRef.current.set(0, 0.8, 0);
    } else if (activeView === "pedestal") {
      targetCameraPosRef.current.set(0, 0.7, 2.5);
      targetLookAtRef.current.set(0, 0.15, 0);
    }
  }, [activeView]);

  // Update materials when finish changes
  useEffect(() => {
    const mats = materialsRef.current;
    if (
      !mats.metalHead ||
      !mats.woodHandle ||
      !mats.pedestalBase ||
      !mats.goldAccent
    )
      return;

    if (activeFinish === "gold_mahogany") {
      (mats.metalHead as THREE.MeshPhysicalMaterial).color.set("#E6C37A");
      (mats.metalHead as THREE.MeshPhysicalMaterial).metalness = 0.95;
      (mats.metalHead as THREE.MeshPhysicalMaterial).roughness = 0.18;

      (mats.goldAccent as THREE.MeshPhysicalMaterial).color.set("#FFD700");
      (mats.goldAccent as THREE.MeshPhysicalMaterial).metalness = 0.98;
      (mats.goldAccent as THREE.MeshPhysicalMaterial).roughness = 0.12;

      (mats.woodHandle as THREE.MeshStandardMaterial).color.set("#2D150A"); // Mahogany
      (mats.woodHandle as THREE.MeshStandardMaterial).roughness = 0.35;

      (mats.pedestalBase as THREE.MeshPhysicalMaterial).color.set("#1A1F1C"); // Polished dark obsidian
      (mats.pedestalBase as THREE.MeshPhysicalMaterial).metalness = 0.7;
      (mats.pedestalBase as THREE.MeshPhysicalMaterial).roughness = 0.15;
    } else if (activeFinish === "titanium_walnut") {
      (mats.metalHead as THREE.MeshPhysicalMaterial).color.set("#C0C8D0");
      (mats.metalHead as THREE.MeshPhysicalMaterial).metalness = 0.96;
      (mats.metalHead as THREE.MeshPhysicalMaterial).roughness = 0.14;

      (mats.goldAccent as THREE.MeshPhysicalMaterial).color.set("#E5E9EC");
      (mats.goldAccent as THREE.MeshPhysicalMaterial).metalness = 0.98;
      (mats.goldAccent as THREE.MeshPhysicalMaterial).roughness = 0.1;

      (mats.woodHandle as THREE.MeshStandardMaterial).color.set("#1E1B18"); // Dark Walnut
      (mats.woodHandle as THREE.MeshStandardMaterial).roughness = 0.4;

      (mats.pedestalBase as THREE.MeshPhysicalMaterial).color.set("#252A2D");
      (mats.pedestalBase as THREE.MeshPhysicalMaterial).metalness = 0.85;
      (mats.pedestalBase as THREE.MeshPhysicalMaterial).roughness = 0.18;
    } else if (activeFinish === "bronze_antique") {
      (mats.metalHead as THREE.MeshPhysicalMaterial).color.set("#A26D38");
      (mats.metalHead as THREE.MeshPhysicalMaterial).metalness = 0.9;
      (mats.metalHead as THREE.MeshPhysicalMaterial).roughness = 0.28;

      (mats.goldAccent as THREE.MeshPhysicalMaterial).color.set("#C88A3C");
      (mats.goldAccent as THREE.MeshPhysicalMaterial).metalness = 0.92;
      (mats.goldAccent as THREE.MeshPhysicalMaterial).roughness = 0.22;

      (mats.woodHandle as THREE.MeshStandardMaterial).color.set("#361C10");
      (mats.woodHandle as THREE.MeshStandardMaterial).roughness = 0.45;

      (mats.pedestalBase as THREE.MeshPhysicalMaterial).color.set("#1E1610");
      (mats.pedestalBase as THREE.MeshPhysicalMaterial).metalness = 0.75;
      (mats.pedestalBase as THREE.MeshPhysicalMaterial).roughness = 0.25;
    }
  }, [activeFinish]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    setIsGpuAccelerated(!isSoftwareGl);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
      alpha: true,
    });
    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 550;
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.copy(targetCameraPosRef.current);
    cameraRef.current = camera;

    // Studio Environment Reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const warmKeyLight = new THREE.DirectionalLight(0xfff5e6, 2.8);
    warmKeyLight.position.set(3, 5, 4);
    warmKeyLight.castShadow = !isSoftwareGl;
    warmKeyLight.shadow.mapSize.width = 1024;
    warmKeyLight.shadow.mapSize.height = 1024;
    warmKeyLight.shadow.bias = -0.0004;
    scene.add(warmKeyLight);

    const coolRimLight = new THREE.DirectionalLight(0x9bc4ff, 1.8);
    coolRimLight.position.set(-4, 3, -3);
    scene.add(coolRimLight);

    const fillHemi = new THREE.HemisphereLight(0xe8f0f8, 0x141f17, 1.2);
    scene.add(fillHemi);

    // Group Hierarchy: Model Group -> Pedestal Group + Gavel Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // --- MATERIALS INITIALIZATION ---
    const metalHeadMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6c37a,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
    });
    const goldAccentMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 0.6,
    });
    const woodHandleMat = new THREE.MeshStandardMaterial({
      color: 0x2d150a,
      roughness: 0.35,
      metalness: 0.08,
    });
    const pedestalBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1f1c,
      metalness: 0.72,
      roughness: 0.15,
      clearcoat: 0.5,
    });
    const pedestalRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      metalness: 0.96,
      roughness: 0.14,
    });

    materialsRef.current = {
      metalHead: metalHeadMat,
      goldAccent: goldAccentMat,
      woodHandle: woodHandleMat,
      pedestalBase: pedestalBaseMat,
      pedestalRing: pedestalRingMat,
    };

    // --- 1. PEDESTAL ASSEMBLY (3 parts) ---
    const pedestalGroup = new THREE.Group();
    modelGroup.add(pedestalGroup);
    pedestalMeshGroupRef.current = pedestalGroup;

    // Pedestal Bottom Base (Beveled heavy plate)
    const basePlateGeo = new THREE.CylinderGeometry(1.2, 1.28, 0.14, 48);
    const basePlateMesh = new THREE.Mesh(basePlateGeo, pedestalBaseMat);
    basePlateMesh.position.y = 0.07;
    basePlateMesh.receiveShadow = !isSoftwareGl;
    pedestalGroup.add(basePlateMesh);

    // Pedestal Gold Trim Ring
    const goldRingGeo = new THREE.TorusGeometry(1.2, 0.024, 24, 64);
    goldRingGeo.rotateX(Math.PI / 2);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, pedestalRingMat);
    goldRingMesh.position.y = 0.14;
    pedestalGroup.add(goldRingMesh);

    // Pedestal Anvil Strike Block (Hexagonal/Octagonal raised polished striking surface)
    const strikingBlockGeo = new THREE.CylinderGeometry(0.92, 0.98, 0.18, 48);
    const strikingBlockMesh = new THREE.Mesh(strikingBlockGeo, pedestalBaseMat);
    strikingBlockMesh.position.y = 0.23;
    strikingBlockMesh.receiveShadow = !isSoftwareGl;
    pedestalGroup.add(strikingBlockMesh);

    // Inner Inlay Plate with subtle rim
    const innerInlayGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.015, 48);
    const innerInlayMesh = new THREE.Mesh(innerInlayGeo, goldAccentMat);
    innerInlayMesh.position.y = 0.325;
    pedestalGroup.add(innerInlayMesh);

    // --- 2. GAVEL (MARTELO CERIMONIAL) ASSEMBLY (6 parts) ---
    const gavelGroup = new THREE.Group();
    // Position gavel hovering slightly tilted above the pedestal ready for the strike
    gavelGroup.position.set(0, 0.72, 0.08);
    gavelGroup.rotation.set(-0.25, 0.45, 0.35);
    modelGroup.add(gavelGroup);
    gavelMeshGroupRef.current = gavelGroup;

    // A. Main Gavel Head Barrel (Brushed Brass Cylinder)
    const headBarrelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.78, 36);
    headBarrelGeo.rotateZ(Math.PI / 2);
    const headBarrelMesh = new THREE.Mesh(headBarrelGeo, metalHeadMat);
    headBarrelMesh.castShadow = !isSoftwareGl;
    gavelGroup.add(headBarrelMesh);

    // B. Left & Right Golden Striking Rings
    const ringLeftGeo = new THREE.TorusGeometry(0.185, 0.018, 20, 36);
    ringLeftGeo.rotateY(Math.PI / 2);
    const ringLeftMesh = new THREE.Mesh(ringLeftGeo, goldAccentMat);
    ringLeftMesh.position.x = -0.28;
    gavelGroup.add(ringLeftMesh);

    const ringRightMesh = ringLeftMesh.clone();
    ringRightMesh.position.x = 0.28;
    gavelGroup.add(ringRightMesh);

    // C. Striking Beveled End Caps
    const capGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.06, 36);
    capGeo.rotateZ(Math.PI / 2);
    const capLeftMesh = new THREE.Mesh(capGeo, goldAccentMat);
    capLeftMesh.position.x = -0.41;
    capLeftMesh.castShadow = !isSoftwareGl;
    gavelGroup.add(capLeftMesh);

    const capRightMesh = new THREE.Mesh(capGeo, goldAccentMat);
    capRightMesh.position.x = 0.41;
    capRightMesh.castShadow = !isSoftwareGl;
    gavelGroup.add(capRightMesh);

    // D. Central Gavel Ferrule / Collar (Connects Head to Handle)
    const ferruleGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.12, 32);
    const ferruleMesh = new THREE.Mesh(ferruleGeo, goldAccentMat);
    ferruleMesh.position.set(0, -0.16, 0);
    gavelGroup.add(ferruleMesh);

    // E. Turned Wood Handle (Mahogany shaft with ergonomic taper)
    const handleGeo = new THREE.CylinderGeometry(0.055, 0.075, 1.25, 32);
    const handleMesh = new THREE.Mesh(handleGeo, woodHandleMat);
    handleMesh.position.set(0, -0.78, 0);
    handleMesh.castShadow = !isSoftwareGl;
    gavelGroup.add(handleMesh);

    // F. Golden Handle Finial (Grip End Cap)
    const finialGeo = new THREE.SphereGeometry(0.08, 24, 24);
    const finialMesh = new THREE.Mesh(finialGeo, goldAccentMat);
    finialMesh.position.set(0, -1.42, 0);
    gavelGroup.add(finialMesh);

    // --- 3. SOFT CONTACT SHADOW PLANE ---
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    shadowGeo.rotateX(-Math.PI / 2);
    // Procedural soft radial gradient shadow
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0.25)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.005;
    scene.add(shadowMesh);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // --- ANIMATION LOOP WITH SECOND-ORDER SPRING/DAMPING ---
    let frameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation towards target
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        targetCameraPosRef.current.x,
        3.5,
        delta,
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        targetCameraPosRef.current.y,
        3.5,
        delta,
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        targetCameraPosRef.current.z,
        3.5,
        delta,
      );

      currentLookAtRef.current.x = THREE.MathUtils.damp(
        currentLookAtRef.current.x,
        targetLookAtRef.current.x,
        3.5,
        delta,
      );
      currentLookAtRef.current.y = THREE.MathUtils.damp(
        currentLookAtRef.current.y,
        targetLookAtRef.current.y,
        3.5,
        delta,
      );
      currentLookAtRef.current.z = THREE.MathUtils.damp(
        currentLookAtRef.current.z,
        targetLookAtRef.current.z,
        3.5,
        delta,
      );
      camera.lookAt(currentLookAtRef.current);

      // Model Rotation
      if (isRotatingRef.current) {
        modelGroup.rotation.y += delta * 0.45;
      }

      // Gentle floating levitation oscillation on gavel
      if (gavelMeshGroupRef.current) {
        gavelMeshGroupRef.current.position.y =
          0.72 + Math.sin(elapsed * 1.8) * 0.035;
        gavelMeshGroupRef.current.rotation.x =
          -0.25 + Math.sin(elapsed * 1.4) * 0.02;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Resize observer for responsive canvas
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries & textures
      basePlateGeo.dispose();
      goldRingGeo.dispose();
      strikingBlockGeo.dispose();
      innerInlayGeo.dispose();
      headBarrelGeo.dispose();
      ringLeftGeo.dispose();
      capGeo.dispose();
      ferruleGeo.dispose();
      handleGeo.dispose();
      finialGeo.dispose();
      shadowGeo.dispose();
      shadowTex.dispose();
    };
  }, []);

  return (
    <div
      className={`relative w-full h-[460px] sm:h-[520px] lg:h-[600px] overflow-hidden select-none ${className}`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Subtle Spec Tag at Top Left (Clean unboxed text) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 text-xs font-mono text-brand-on-dark/80 bg-black/40 px-3 py-1.5 rounded-lg border border-invert backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent-gold-ink" />
          <span>MOTOR 3D EM TEMPO REAL · LATÃO ESCOVADO & MOGNO</span>
        </div>
      </div>

      {/* Consolidated Ergonomic Bottom Dock (Three.js Directive Compliant) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[620px] transition-all duration-300">
        {/* Cinema / Collapse Button on top edge */}
        <div className="flex justify-center -mb-2">
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="px-3 py-1 rounded-t-lg bg-black/75 hover:bg-black/90 text-[11px] font-medium text-brand-on-dark/80 hover:text-white border-t border-x border-invert flex items-center gap-1 cursor-pointer transition-colors shadow-md"
            title={
              isControlsOpen
                ? "Recolher dock de controles 3D"
                : "Expandir controles 3D"
            }
          >
            {isControlsOpen ? (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Ocultar Controles (Modo Cinema)</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Controles do Modelo 3D</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Surface */}
        {isControlsOpen && (
          <div className="bg-[#0A0D0B]/90 backdrop-blur-md border border-accent-gold/25 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs text-brand-on-dark">
            {/* View presets */}
            <div className="flex items-center gap-1 bg-surface-card/5 p-1 rounded-xl border border-invert">
              <button
                onClick={() => setActiveView("overview")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  activeView === "overview"
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-brand-on-dark/80 hover:text-white"
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveView("gavel")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  activeView === "gavel"
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-brand-on-dark/80 hover:text-white"
                }`}
              >
                Martelo
              </button>
              <button
                onClick={() => setActiveView("pedestal")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  activeView === "pedestal"
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-brand-on-dark/80 hover:text-white"
                }`}
              >
                Pedestal
              </button>
            </div>

            {/* Finish Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-brand-on-dark/75 hidden sm:inline">
                Acabamento:
              </span>
              <div className="flex items-center gap-1 bg-surface-card/5 p-1 rounded-xl border border-invert">
                <button
                  onClick={() => setActiveFinish("gold_mahogany")}
                  className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    activeFinish === "gold_mahogany"
                      ? "bg-accent-gold text-brand-deep font-semibold"
                      : "text-brand-on-dark/80 hover:text-white"
                  }`}
                  title="Ouro & Mogno Nobre"
                >
                  Ouro Imperial
                </button>
                <button
                  onClick={() => setActiveFinish("titanium_walnut")}
                  className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    activeFinish === "titanium_walnut"
                      ? "bg-accent-gold text-brand-deep font-semibold"
                      : "text-brand-on-dark/80 hover:text-white"
                  }`}
                  title="Titânio Escovado & Nogueira"
                >
                  Titânio
                </button>
                <button
                  onClick={() => setActiveFinish("bronze_antique")}
                  className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    activeFinish === "bronze_antique"
                      ? "bg-accent-gold text-brand-deep font-semibold"
                      : "text-brand-on-dark/80 hover:text-white"
                  }`}
                  title="Bronze Pátina Antiga"
                >
                  Bronze
                </button>
              </div>
            </div>

            {/* Auto-Rotation Toggle */}
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] ${
                isAutoRotating
                  ? "bg-brand-primary text-accent-gold border-accent-gold/40"
                  : "bg-surface-card/5 text-brand-on-dark/80 border-invert hover:text-white"
              }`}
              title="Alternar rotação contínua"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isAutoRotating ? "animate-spin" : ""}`}
                style={{ animationDuration: "6s" }}
              />
              <span className="hidden sm:inline">
                {isAutoRotating ? "Girando" : "Pausado"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

