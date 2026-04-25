import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import clsx from "clsx";

/**
 * VoiceOrb — the 3D hero centerpiece.
 *
 * Concept: a rotating "Monarch Sigil" — a translucent blue inner core orb,
 * a pulsating fresnel shell, three orthogonal runic rings, and an orbiting
 * shadow-soldier particle cloud that flares up on `arise`.
 *
 * All geometry is procedural (no models). Shaders are inline GLSL.
 * Performance budget: ~3k tris + 256-particle Points cloud, sub-60fps cost
 * on M-series Macs. Falls back to a static SVG sigil if WebGL2 is missing.
 */

interface Props {
  /** "idle" | "listening" | "speaking" — drives intensity */
  state?: "idle" | "listening" | "speaking";
  /** When set (recent timestamp), play the arise burst */
  ariseAt?: number;
  /** Audio level 0..1 — drives orb pulse if provided */
  audioLevel?: number;
  className?: string;
}

// ─── Inline GLSL helpers ─────────────────────────────────────────────────

const NOISE_GLSL = /* glsl */ `
  // Classic 3D noise — ashima/webgl-noise (simplex), MIT
  vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m*m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

// ─── Inner core orb (custom shader) ──────────────────────────────────────

function CoreOrb({
  intensity,
  ariseAt,
}: {
  intensity: number;
  ariseAt: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uArise: { value: 0 },
      uColorA: { value: new THREE.Color("#4a9eff") },
      uColorB: { value: new THREE.Color("#9b4aff") },
      uColorHot: { value: new THREE.Color("#ffcc00") },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (matRef.current) {
      const u = matRef.current.uniforms;
      u.uTime.value = t;
      // smooth toward target intensity
      u.uIntensity.value = THREE.MathUtils.lerp(
        u.uIntensity.value,
        intensity,
        0.08,
      );
      // arise impulse decays over 1.4s
      const since = (Date.now() - ariseAt) / 1400;
      u.uArise.value = ariseAt && since > 0 && since < 1
        ? 1 - since
        : THREE.MathUtils.lerp(u.uArise.value, 0, 0.2);
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.18;
      meshRef.current.rotation.x = Math.sin(t * 0.13) * 0.18;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.0, 6]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewPos;
          varying vec3 vPos;
          uniform float uTime;
          uniform float uIntensity;
          uniform float uArise;
          ${NOISE_GLSL}
          void main(){
            vec3 p = position;
            float n = snoise(p * 1.4 + vec3(0.0, uTime * 0.35, 0.0));
            float n2 = snoise(p * 3.0 - vec3(uTime * 0.5));
            float disp = (n * 0.10 + n2 * 0.045)
              * (0.6 + uIntensity * 0.7 + uArise * 1.2);
            p += normal * disp;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewPos = -mv.xyz;
            vPos = p;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewPos;
          varying vec3 vPos;
          uniform float uTime;
          uniform float uIntensity;
          uniform float uArise;
          uniform vec3  uColorA;
          uniform vec3  uColorB;
          uniform vec3  uColorHot;
          void main(){
            vec3 V = normalize(vViewPos);
            float fres = pow(1.0 - max(dot(normalize(vNormal), V), 0.0), 2.5);
            float bands = 0.5 + 0.5 * sin(vPos.y * 18.0 + uTime * 1.2);
            bands *= 0.18;
            vec3 base = mix(uColorA, uColorB, smoothstep(-0.6, 0.6, vPos.y));
            vec3 hot = mix(base, uColorHot, uArise * 0.85);
            vec3 col = hot + fres * (1.4 + uIntensity * 1.2);
            col += bands;
            float alpha = clamp(0.32 + fres * 0.85 + uIntensity * 0.2, 0.0, 1.0);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

// ─── Outer fresnel shell ─────────────────────────────────────────────────

function FresnelShell({ intensity }: { intensity: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color("#79b6ff") },
    }),
    [],
  );
  useFrame((s) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = s.clock.getElapsedTime();
    matRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uIntensity.value,
      intensity,
      0.06,
    );
  });
  return (
    <mesh scale={1.32}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewPos;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewPos = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewPos;
          uniform float uTime;
          uniform float uIntensity;
          uniform vec3  uColor;
          void main(){
            vec3 V = normalize(vViewPos);
            float fres = pow(1.0 - max(dot(normalize(vNormal), V), 0.0), 1.4);
            float pulse = 0.5 + 0.5 * sin(uTime * 1.6);
            float a = fres * (0.34 + 0.5 * pulse + uIntensity * 0.55);
            gl_FragColor = vec4(uColor, a);
          }
        `}
      />
    </mesh>
  );
}

// ─── Three orthogonal runic rings ────────────────────────────────────────

function RuneRings() {
  const grpRef = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!grpRef.current) return;
    const t = s.clock.getElapsedTime();
    grpRef.current.rotation.y = t * 0.25;
    grpRef.current.rotation.x = Math.sin(t * 0.12) * 0.25;
    grpRef.current.rotation.z = Math.cos(t * 0.07) * 0.18;
  });

  const ringGeom = useMemo(() => {
    return new THREE.TorusGeometry(1.7, 0.012, 8, 160);
  }, []);
  const tickGeom = useMemo(() => {
    // 24 small radial ticks around a ring
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r1 = 1.78;
      const r2 = 1.92;
      verts.push(Math.cos(a) * r1, Math.sin(a) * r1, 0);
      verts.push(Math.cos(a) * r2, Math.sin(a) * r2, 0);
    }
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(verts), 3),
    );
    return g;
  }, []);

  const matBlue = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#4a9eff",
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );
  const matViolet = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#9b4aff",
        transparent: true,
        opacity: 0.7,
      }),
    [],
  );
  const tickMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#79b6ff",
        transparent: true,
        opacity: 0.55,
      }),
    [],
  );

  return (
    <group ref={grpRef}>
      <mesh geometry={ringGeom} material={matBlue} />
      <mesh
        geometry={ringGeom}
        material={matViolet}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={ringGeom}
        material={matBlue}
        rotation={[0, Math.PI / 2, 0]}
      />
      <lineSegments geometry={tickGeom} material={tickMat} />
    </group>
  );
}

// ─── Shadow particle cloud (soldiers) ────────────────────────────────────

function ShadowParticles({
  count = 320,
  ariseAt,
}: {
  count?: number;
  ariseAt: number;
}) {
  const ptsRef = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { positions, seeds } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 2.0 + Math.random() * 0.55;
      p[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.cos(phi);
      p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      s[i] = Math.random();
    }
    return { positions: p, seeds: s };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uArise: { value: 0 },
      uPxSize: { value: 1.4 },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      const since = (Date.now() - ariseAt) / 1400;
      matRef.current.uniforms.uArise.value =
        ariseAt && since > 0 && since < 1
          ? 1 - since
          : THREE.MathUtils.lerp(matRef.current.uniforms.uArise.value, 0, 0.18);
    }
    if (ptsRef.current) {
      ptsRef.current.rotation.y = t * 0.07;
    }
  });

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float aSeed;
          varying float vSeed;
          varying float vDist;
          uniform float uTime;
          uniform float uArise;
          uniform float uPxSize;
          void main(){
            vSeed = aSeed;
            vec3 p = position;
            float wob = sin(uTime * (0.6 + aSeed * 1.4) + aSeed * 6.28) * 0.06;
            p += normalize(p) * wob;
            // arise: shoot outward, then settle
            p += normalize(p) * uArise * (0.6 + aSeed * 0.9);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vDist = -mv.z;
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (uPxSize + uArise * 2.4) * (260.0 / vDist) * (0.6 + aSeed);
          }
        `}
        fragmentShader={/* glsl */ `
          varying float vSeed;
          varying float vDist;
          uniform float uArise;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float r = length(c);
            float a = smoothstep(0.5, 0.0, r);
            vec3 cool = vec3(0.29, 0.62, 1.0);
            vec3 hot  = vec3(1.0, 0.8, 0.29);
            vec3 col = mix(cool, hot, uArise * 0.6 + vSeed * 0.1);
            gl_FragColor = vec4(col, a * (0.55 + 0.45 * vSeed));
          }
        `}
      />
    </points>
  );
}

// ─── "Arise" column flare (billboard) ────────────────────────────────────

function AriseColumn({ ariseAt }: { ariseAt: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(
    () => ({
      uArise: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  );
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (matRef.current) {
      const since = (Date.now() - ariseAt) / 1400;
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uArise.value =
        ariseAt && since > 0 && since < 1 ? 1 - since : 0;
    }
    if (meshRef.current && state.camera) {
      meshRef.current.lookAt(state.camera.position);
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[1.4, 6.0]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec2 vUv;
          uniform float uArise;
          uniform float uTime;
          void main(){
            float dx = abs(vUv.x - 0.5);
            float core = smoothstep(0.5, 0.0, dx);
            float vert = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
            float flick = 0.85 + 0.15 * sin(uTime * 18.0 + vUv.y * 12.0);
            float a = core * vert * uArise * flick;
            vec3 col = mix(vec3(0.29, 0.62, 1.0), vec3(1.0, 0.85, 0.4), uArise * 0.6);
            gl_FragColor = vec4(col, a);
          }
        `}
      />
    </mesh>
  );
}

// ─── Scene ──────────────────────────────────────────────────────────────

function Scene({
  state,
  ariseAt,
  audioLevel,
}: Required<Pick<Props, "state">> & { ariseAt: number; audioLevel: number }) {
  const targetIntensity =
    state === "speaking" ? 0.9 : state === "listening" ? 0.55 : 0.18;
  const intensity = Math.max(targetIntensity, audioLevel);

  return (
    <>
      <color attach="background" args={["#06091a"]} />
      <fog attach="fog" args={["#06091a", 4.5, 9]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 2]} intensity={1.4} color="#4a9eff" />
      <pointLight position={[-2, -1.5, -1]} intensity={0.7} color="#9b4aff" />
      <CoreOrb intensity={intensity} ariseAt={ariseAt} />
      <FresnelShell intensity={intensity} />
      <RuneRings />
      <ShadowParticles ariseAt={ariseAt} />
      <AriseColumn ariseAt={ariseAt} />
    </>
  );
}

// ─── Public component (with WebGL2 fallback) ────────────────────────────

function detectWebGL2(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

function FallbackSigil({
  ariseAt,
  state,
}: {
  ariseAt: number;
  state: "idle" | "listening" | "speaking";
}) {
  const flashing = ariseAt && Date.now() - ariseAt < 1200;
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-[80%] max-w-[260px] animate-float">
        <defs>
          <radialGradient id="orb-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cfe3ff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#4a9eff" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0a0e27" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="60" fill="url(#orb-grad)" />
        <g
          fill="none"
          stroke="#4a9eff"
          strokeWidth="1"
          opacity={state === "idle" ? 0.6 : 0.95}
        >
          <circle cx="100" cy="100" r="86" />
          <ellipse cx="100" cy="100" rx="86" ry="32" />
          <ellipse cx="100" cy="100" rx="32" ry="86" />
        </g>
        <g stroke="#9b4aff" strokeWidth="1" opacity="0.5" fill="none">
          <polygon points="100,10 140,80 100,55 60,80" />
        </g>
        {flashing && (
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="#9b4aff"
            strokeWidth="1.5"
            opacity="0.9"
            className="animate-shockwave origin-center"
            style={{ transformBox: "fill-box" }}
          />
        )}
      </svg>
    </div>
  );
}

export function VoiceOrb({
  state = "idle",
  ariseAt = 0,
  audioLevel = 0,
  className,
}: Props) {
  const [hasWebgl2, setHasWebgl2] = useState(true);
  useEffect(() => setHasWebgl2(detectWebGL2()), []);

  return (
    <div className={clsx("relative w-full h-full", className)}>
      {/* outer halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(74,158,255,0.22) 0%, rgba(155,74,255,0.08) 40%, rgba(10,14,39,0) 70%)",
        }}
      />
      {hasWebgl2 ? (
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 4.6], fov: 36 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Scene state={state} ariseAt={ariseAt} audioLevel={audioLevel} />
        </Canvas>
      ) : (
        <FallbackSigil state={state} ariseAt={ariseAt} />
      )}
      {/* arise burst CSS layer */}
      {ariseAt > 0 && Date.now() - ariseAt < 1200 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="absolute rounded-full animate-shockwave"
            style={{
              width: "60%",
              aspectRatio: "1 / 1",
              border: "1.5px solid rgba(155,74,255,0.7)",
              boxShadow: "0 0 32px rgba(155,74,255,0.5), inset 0 0 32px rgba(155,74,255,0.4)",
            }}
          />
        </span>
      )}
    </div>
  );
}

export default VoiceOrb;
