import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  OrthographicCamera as DreiOrthographicCamera,
  RoundedBox,
  Sphere,
} from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, OrthographicCamera as ThreeOrthographicCamera, type Group } from "three";
import { ShieldCheck } from "lucide-react";

type LandingHeroPilot3DProps = {
  friendAvatars: readonly string[];
};

function useFloatRig(baseX: number, baseY: number, lift = 0.06) {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    const targetX = baseX + state.pointer.y * 0.1;
    const targetY = baseY + state.pointer.x * 0.18;
    const targetLift = Math.sin(state.clock.elapsedTime * 0.6) * lift;

    groupRef.current.rotation.x = MathUtils.damp(groupRef.current.rotation.x, targetX, 4.2, delta);
    groupRef.current.rotation.y = MathUtils.damp(groupRef.current.rotation.y, targetY, 4.2, delta);
    groupRef.current.position.y = MathUtils.damp(groupRef.current.position.y, targetLift, 4, delta);
  });

  return groupRef;
}

function WindowGlow({ position }: { position: [number, number, number] }) {
  return (
    <RoundedBox args={[0.34, 0.36, 0.08]} position={position} radius={0.04} smoothness={4}>
      <meshStandardMaterial
        color="#fff7d2"
        emissive="#ffd37c"
        emissiveIntensity={0.45}
        roughness={0.22}
      />
    </RoundedBox>
  );
}

function HouseCluster({
  position,
  body,
  roof,
  accent,
  scale = 1,
}: {
  position: [number, number, number];
  body: string;
  roof: string;
  accent: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[1.7, 2.1, 1.7]} radius={0.18} smoothness={6}>
        <meshStandardMaterial color={body} roughness={0.88} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[1.95, 0.24, 1.95]} position={[0, 1.25, 0]} radius={0.14} smoothness={6}>
        <meshStandardMaterial color={roof} roughness={0.82} metalness={0.02} />
      </RoundedBox>
      {[-0.46, 0, 0.46].map((offset) => (
        <RoundedBox
          key={offset}
          args={[0.36, 0.52, 0.12]}
          position={[offset, 0.66, 0.88]}
          radius={0.05}
          smoothness={5}
        >
          <meshStandardMaterial color={accent} roughness={0.52} metalness={0.03} />
        </RoundedBox>
      ))}
      <WindowGlow position={[-0.48, 0.16, 0.9]} />
      <WindowGlow position={[0, 0.16, 0.9]} />
      <WindowGlow position={[0.48, 0.16, 0.9]} />
      <WindowGlow position={[0.88, 0.35, 0.18]} />
      <WindowGlow position={[0.88, -0.12, 0.18]} />
    </group>
  );
}

function LocationPin({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.4} rotationIntensity={0.1} floatIntensity={0.4}>
      <group position={position}>
        <Sphere args={[0.22, 28, 28]} position={[0, 0.12, 0]}>
          <meshStandardMaterial color="#2f6cf6" roughness={0.28} metalness={0.04} />
        </Sphere>
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.16, 0.38, 18]} />
          <meshStandardMaterial color="#2f6cf6" roughness={0.3} metalness={0.03} />
        </mesh>
        <Sphere args={[0.07, 18, 18]} position={[0, 0.12, 0.17]}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.02} />
        </Sphere>
      </group>
    </Float>
  );
}

function LandingAccentScene() {
  const groupRef = useFloatRig(-0.52, 0.58, 0.04);
  const cameraRef = useRef<ThreeOrthographicCamera>(null);

  useEffect(() => {
    cameraRef.current?.lookAt(0, -0.25, 0);
  }, []);

  return (
    <>
      <DreiOrthographicCamera ref={cameraRef} makeDefault position={[9, 8, 9]} zoom={72} />
      <ambientLight intensity={1.08} color="#eef3ff" />
      <hemisphereLight intensity={0.5} color="#ffffff" groundColor="#c9d9ff" />
      <directionalLight position={[8, 12, 6]} intensity={1.5} color="#fff2dd" />
      <pointLight position={[-4, 4, 3]} intensity={0.42} color="#8ab5ff" />

      <group ref={groupRef} position={[0, -0.02, 0]} scale={1.24}>
        <RoundedBox args={[8.8, 0.82, 6.6]} position={[0, -1.6, 0]} radius={0.34} smoothness={8}>
          <meshStandardMaterial color="#dce7ff" roughness={0.9} metalness={0.02} />
        </RoundedBox>
        <RoundedBox args={[5.8, 0.24, 2.1]} position={[1.2, -0.92, 1.45]} radius={0.18} smoothness={6}>
          <meshStandardMaterial color="#fff7ee" roughness={0.68} metalness={0.01} />
        </RoundedBox>
        <RoundedBox args={[2.1, 0.2, 1.6]} position={[-2.5, -0.92, -1.1]} radius={0.16} smoothness={6}>
          <meshStandardMaterial color="#fff1dc" roughness={0.68} metalness={0.01} />
        </RoundedBox>

        <Float speed={1.8} rotationIntensity={0.14} floatIntensity={0.22}>
          <HouseCluster position={[-1.55, -0.18, -0.4]} body="#f2ecff" roof="#fff8f0" accent="#ff8ca7" />
        </Float>
        <Float speed={1.45} rotationIntensity={0.12} floatIntensity={0.18}>
          <HouseCluster
            position={[1.24, 0.4, -0.82]}
            body="#f8f0f8"
            roof="#eef2ff"
            accent="#5e8fff"
            scale={1.06}
          />
        </Float>
        <Float speed={1.6} rotationIntensity={0.1} floatIntensity={0.2}>
          <HouseCluster
            position={[0.4, -0.02, 1.26]}
            body="#f2fff3"
            roof="#fff8ea"
            accent="#7fd9ac"
            scale={0.92}
          />
        </Float>
        <Float speed={1.52} rotationIntensity={0.12} floatIntensity={0.24}>
          <HouseCluster
            position={[0.18, 0.18, 0.2]}
            body="#ffffff"
            roof="#ffe8ef"
            accent="#76a2ff"
            scale={1.18}
          />
        </Float>

        <Float speed={1.9} rotationIntensity={0.1} floatIntensity={0.32}>
          <RoundedBox args={[0.56, 0.56, 0.56]} position={[-3.1, -0.26, 1.4]} radius={0.12} smoothness={5}>
            <meshStandardMaterial color="#ffdcb4" roughness={0.54} metalness={0.02} />
          </RoundedBox>
        </Float>
        <Float speed={1.65} rotationIntensity={0.16} floatIntensity={0.28}>
          <RoundedBox args={[0.68, 0.4, 0.68]} position={[3.1, -0.2, 1.1]} radius={0.12} smoothness={5}>
            <meshStandardMaterial color="#d6e6ff" roughness={0.56} metalness={0.02} />
          </RoundedBox>
        </Float>
        <LocationPin position={[2.42, 2.18, 0.42]} />
      </group>

      <ContactShadows
        position={[0, -1.95, 0]}
        opacity={0.42}
        blur={2.6}
        scale={9.6}
        far={3.1}
        resolution={512}
        color="#8ba7e8"
      />
    </>
  );
}

function Pillow({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <RoundedBox args={[0.6, 0.22, 0.46]} position={position} radius={0.12} smoothness={5}>
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.02} />
    </RoundedBox>
  );
}

function LoginAccentScene() {
  const groupRef = useFloatRig(-0.62, 0.42, 0.03);
  const cameraRef = useRef<ThreeOrthographicCamera>(null);

  useEffect(() => {
    cameraRef.current?.lookAt(0.38, -0.78, -0.1);
  }, []);

  return (
    <>
      <DreiOrthographicCamera ref={cameraRef} makeDefault position={[7.2, 5.8, 7.2]} zoom={74} />
      <ambientLight intensity={1.04} color="#f8f8ff" />
      <hemisphereLight intensity={0.46} color="#ffffff" groundColor="#cfddff" />
      <directionalLight position={[7, 11, 5]} intensity={1.42} color="#fff1d9" />
      <pointLight position={[-4, 5, -2]} intensity={0.36} color="#95c4ff" />

      <group ref={groupRef} position={[0.42, -0.62, 0.08]} scale={1.02}>
        <RoundedBox args={[7.2, 0.34, 5.8]} position={[0, -1.86, 0]} radius={0.24} smoothness={8}>
          <meshStandardMaterial color="#dce6ff" roughness={0.9} metalness={0.01} />
        </RoundedBox>
        <RoundedBox args={[7.2, 4.3, 0.24]} position={[0, 0.15, -2.72]} radius={0.14} smoothness={6}>
          <meshStandardMaterial color="#eef3ff" roughness={0.84} metalness={0.02} />
        </RoundedBox>
        <RoundedBox args={[0.24, 4.3, 5.8]} position={[-3.48, 0.15, 0]} radius={0.14} smoothness={6}>
          <meshStandardMaterial color="#f8f6ff" roughness={0.9} metalness={0.02} />
        </RoundedBox>

        <RoundedBox args={[2.8, 0.34, 4.2]} position={[0.7, -1.26, -0.16]} radius={0.18} smoothness={6}>
          <meshStandardMaterial color="#f7ecdf" roughness={0.84} metalness={0.02} />
        </RoundedBox>
        <RoundedBox args={[2.35, 0.46, 3.62]} position={[0.72, -0.92, -0.14]} radius={0.18} smoothness={6}>
          <meshStandardMaterial color="#ffffff" roughness={0.76} metalness={0.02} />
        </RoundedBox>
        <RoundedBox args={[2.4, 1.02, 0.28]} position={[0.72, -0.25, -1.78]} radius={0.12} smoothness={6}>
          <meshStandardMaterial color="#dfccb5" roughness={0.82} metalness={0.02} />
        </RoundedBox>
        <Pillow position={[0.05, -0.46, -1.28]} color="#d7dcf8" />
        <Pillow position={[0.86, -0.44, -1.22]} color="#f5d8d8" />
        <Pillow position={[1.58, -0.43, -1.08]} color="#ece7ff" />

        <RoundedBox args={[1.7, 0.06, 1.1]} position={[-1.52, -1.52, 0.92]} radius={0.08} smoothness={5}>
          <meshStandardMaterial color="#d8eef4" roughness={0.76} metalness={0.01} />
        </RoundedBox>
        <RoundedBox args={[0.78, 0.14, 0.78]} position={[-1.86, -1.28, 1.24]} radius={0.12} smoothness={5}>
          <meshStandardMaterial color="#d39b73" roughness={0.62} metalness={0.02} />
        </RoundedBox>
        <Sphere args={[0.42, 24, 24]} position={[-1.86, -0.76, 1.24]}>
          <meshStandardMaterial color="#74b888" roughness={0.78} metalness={0.02} />
        </Sphere>

        <mesh position={[-1.52, 1.62, -2.56]}>
          <planeGeometry args={[1.95, 2.8]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff4c5" emissiveIntensity={0.18} />
        </mesh>
        <RoundedBox args={[1.52, 1.95, 0.08]} position={[-1.52, 1.6, -2.52]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color="#f8fbff" roughness={0.62} metalness={0.02} />
        </RoundedBox>

        <RoundedBox args={[0.84, 0.08, 0.84]} position={[-2.7, -1.22, -0.86]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color="#f5f1ff" roughness={0.78} metalness={0.01} />
        </RoundedBox>
        <mesh position={[-2.92, 0, -0.94]}>
          <cylinderGeometry args={[0.08, 0.08, 1.5, 18]} />
          <meshStandardMaterial color="#c8cedf" roughness={0.44} metalness={0.08} />
        </mesh>
        <mesh position={[-2.66, 0.72, -0.64]} rotation={[0.42, 0, -0.48]}>
          <cylinderGeometry args={[0.05, 0.05, 1.06, 16]} />
          <meshStandardMaterial color="#c8cedf" roughness={0.44} metalness={0.08} />
        </mesh>
        <mesh position={[-2.46, 1.04, -0.42]} rotation={[0.12, 0.08, 0.08]}>
          <coneGeometry args={[0.22, 0.34, 18]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.36} metalness={0.03} />
        </mesh>
      </group>

      <ContactShadows
        position={[0, -1.98, 0]}
        opacity={0.26}
        blur={2.4}
        scale={8.4}
        far={3.1}
        resolution={512}
        color="#95ace6"
      />
    </>
  );
}

export function LandingHeroPilot3D({ friendAvatars }: LandingHeroPilot3DProps) {
  const visibleAvatars = useMemo(() => friendAvatars.slice(0, 2), [friendAvatars]);

  return (
    <div className="pointer-events-none relative isolate h-[640px] overflow-hidden rounded-[40px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(227,236,255,0.94)_34%,_rgba(205,221,255,0.92)_100%)] shadow-[0_32px_90px_rgba(58,96,186,0.18)]">
      <div className="absolute inset-x-8 top-6 h-32 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute -left-10 bottom-12 h-40 w-40 rounded-full bg-secondary-container/28 blur-3xl" />
      <div className="absolute -right-10 top-20 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <LandingAccentScene />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 p-6 xl:p-8">
        <div className="absolute bottom-8 left-8 w-[18rem] rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_22px_48px_rgba(48,76,150,0.18)] backdrop-blur-md">
          <div className="mb-4 flex -space-x-3 overflow-hidden">
            {visibleAvatars.map((avatar) => (
              <img
                key={avatar}
                src={avatar}
                alt="Thanh vien RommZ"
                className="h-10 w-10 rounded-full ring-2 ring-white"
              />
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary ring-2 ring-white">
              +12
            </div>
          </div>
          <p className="text-sm font-bold text-foreground">12+ bạn mới</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Đang tìm phòng gần Quận 1 và Thủ Đức trong hôm nay.
          </p>
        </div>

        <div className="absolute bottom-10 right-8 w-[14.5rem] rounded-[26px] border border-white/65 bg-white/78 p-5 shadow-[0_18px_42px_rgba(58,96,186,0.14)] backdrop-blur-md">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[18px] bg-primary-container/50 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-foreground">Xác thực rõ ràng</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ưu tiên các listing có hình thật, vị trí rõ và phản hồi nhanh.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginHeroPilot3D() {
  return (
    <div className="pointer-events-none relative stitch-editorial-shadow aspect-[4/5] max-w-[28rem] overflow-hidden rounded-[32px] border border-white/45 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(229,237,255,0.94)_40%,_rgba(207,221,255,0.92)_100%)] xl:max-w-[30rem]">
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <LoginAccentScene />
      </Canvas>
    </div>
  );
}
