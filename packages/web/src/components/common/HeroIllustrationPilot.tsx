import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useMemo } from "react";
import type { MotionStyle } from "framer-motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { stitchAssets } from "@/lib/stitchAssets";
import { cn } from "@/components/ui/utils";

type LandingHeroIllustrationProps = {
  friendAvatars: readonly string[];
};

function useHeroParallax(intensity = 18) {
  const shouldReduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 180, damping: 24, mass: 0.9 });
  const y = useSpring(rawY, { stiffness: 180, damping: 24, mass: 0.9 });

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    rawX.set(offsetX * intensity * 2);
    rawY.set(offsetY * intensity * 2);
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return { shouldReduceMotion, x, y, handlePointerMove, reset };
}

function GlowCube({
  className,
  style,
}: {
  className?: string;
  style?: MotionStyle;
}) {
  return (
    <motion.div
      className={cn(
        "absolute rounded-[20px] border border-white/65 bg-white/55 shadow-[0_24px_48px_rgba(63,84,150,0.16)] backdrop-blur-md",
        className,
      )}
      style={style}
    />
  );
}

function ImageSlab({
  src,
  className,
  imageClassName,
  style,
}: {
  src: string;
  className?: string;
  imageClassName?: string;
  style?: MotionStyle;
}) {
  return (
    <motion.div className={cn("absolute", className)} style={style}>
      <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-[34px] bg-primary/10 blur-2xl" />
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[34px] border border-white/45 bg-white/45" />
      <div className="relative h-full overflow-hidden rounded-[34px] border border-white/75 bg-white/70 shadow-[0_28px_70px_rgba(47,75,151,0.22)] backdrop-blur-md">
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={cn("h-full w-full object-cover saturate-[0.88]", imageClassName)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.6),rgba(255,255,255,0.12)_38%,rgba(177,204,255,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_44%)]" />
      </div>
    </motion.div>
  );
}

function InfoCard({
  className,
  title,
  description,
  icon,
  avatars,
}: {
  className?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  avatars?: readonly string[];
}) {
  return (
    <motion.div
      className={cn(
        "absolute rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_24px_56px_rgba(45,74,150,0.18)] backdrop-blur-xl",
        className,
      )}
    >
      {avatars ? (
        <div className="mb-4 flex -space-x-3 overflow-hidden">
          {avatars.map((avatar) => (
            <img
              key={avatar}
              src={avatar}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 rounded-full ring-2 ring-white"
            />
          ))}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary ring-2 ring-white">
            +12
          </div>
        </div>
      ) : null}
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary-container/42 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </motion.div>
  );
}

export function LandingHeroIllustration({ friendAvatars }: LandingHeroIllustrationProps) {
  const { shouldReduceMotion, x, y, handlePointerMove, reset } = useHeroParallax(16);
  const visibleAvatars = useMemo(() => friendAvatars.slice(0, 2), [friendAvatars]);
  const stageX = useTransform(x, (value) => value * -0.22);
  const stageY = useTransform(y, (value) => value * -0.18);
  const leftX = useTransform(x, (value) => value * -0.7);
  const leftY = useTransform(y, (value) => value * -0.52);
  const centerX = useTransform(x, (value) => value * 0.42);
  const centerY = useTransform(y, (value) => value * 0.34);
  const rightX = useTransform(x, (value) => value * 0.88);
  const rightY = useTransform(y, (value) => value * -0.46);
  const chipX = useTransform(x, (value) => value * 0.28);
  const chipY = useTransform(y, (value) => value * -0.28);
  const orbX = useTransform(x, (value) => value * -0.36);
  const orbY = useTransform(y, (value) => value * 0.32);
  const glowOneX = useTransform(x, (value) => value * -1.08);
  const glowOneY = useTransform(y, (value) => value * -0.92);
  const glowTwoX = useTransform(x, (value) => value * 1.1);
  const glowTwoY = useTransform(y, (value) => value * 0.84);
  const glowThreeX = useTransform(x, (value) => value * 0.78);
  const glowThreeY = useTransform(y, (value) => value * 0.54);
  const pinX = useTransform(x, (value) => value * 0.64);
  const pinY = useTransform(y, (value) => value * -0.7);
  const platformY = useTransform(y, (value) => value * 0.16);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative isolate h-[640px] overflow-hidden rounded-[40px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(231,239,255,0.96)_36%,rgba(214,228,255,0.9)_100%)] shadow-[0_36px_90px_rgba(58,96,186,0.18)]"
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      <motion.div
        className="absolute inset-x-10 top-8 h-24 rounded-full bg-white/60 blur-3xl"
        style={{ x: orbX, y: orbY }}
      />
      <motion.div
        className="absolute -left-12 bottom-4 h-52 w-52 rounded-full bg-secondary-container/28 blur-3xl"
        style={{ x: orbX, y: chipY }}
      />
      <motion.div
        className="absolute -right-10 top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        style={{ x: chipX, y: orbY }}
      />

      <motion.div
        className="absolute inset-x-[7%] bottom-[10%] top-[8%]"
        style={{ x: stageX, y: stageY }}
      >
        <motion.div
          className="absolute bottom-3 left-[6%] right-[4%] h-[26%] rounded-[42px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(219,228,255,0.96))] shadow-[0_30px_80px_rgba(66,92,160,0.15)]"
          style={{ x: centerX, y: platformY, rotate: 2.5 }}
        />
        <motion.div
          className="absolute bottom-[12%] left-[12%] h-[62%] w-[31%]"
          style={{ x: leftX, y: leftY, rotate: -9 }}
        >
          <ImageSlab
            src={stitchAssets.landing.heroLeftTall}
            className="inset-0"
            imageClassName="scale-[1.12]"
          />
        </motion.div>
        <motion.div
          className="absolute right-[10%] top-[5%] h-[56%] w-[33%]"
          style={{ x: rightX, y: rightY, rotate: 8 }}
        >
          <ImageSlab src={stitchAssets.landing.heroRightTall} className="inset-0" />
        </motion.div>
        <motion.div
          className="absolute bottom-[12%] left-[36%] h-[38%] w-[40%]"
          style={{ x: centerX, y: centerY, rotate: -3 }}
        >
          <ImageSlab
            src={stitchAssets.landing.heroRightBottom}
            className="inset-0"
            imageClassName="scale-[1.05]"
          />
        </motion.div>

        <GlowCube
          className="left-[3%] top-[30%] h-18 w-18"
          style={{ x: glowOneX, y: glowOneY, rotate: -9 }}
        />
        <GlowCube
          className="bottom-[28%] right-[2%] h-22 w-22"
          style={{ x: glowTwoX, y: glowTwoY, rotate: 11 }}
        />
        <GlowCube
          className="bottom-[8%] right-[14%] h-14 w-14"
          style={{ x: glowThreeX, y: glowThreeY, rotate: -6 }}
        />

        <motion.div
          className="absolute right-[8%] top-[22%] flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_18px_34px_rgba(47,108,246,0.34)]"
          style={{ x: pinX, y: pinY }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -8, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 4.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
          }
        >
          <MapPin className="h-5 w-5 text-white" />
        </motion.div>
      </motion.div>

      <InfoCard
        className="bottom-8 left-8 w-[18rem]"
        title="12+ bạn mới"
        description="Đang tìm phòng gần Quận 1 và Thủ Đức trong hôm nay."
        avatars={visibleAvatars}
      />
      <InfoCard
        className="bottom-10 right-8 w-[14.5rem]"
        title="Xác thực rõ ràng"
        description="Ưu tiên các listing có hình thật, vị trí rõ và phản hồi nhanh."
        icon={<ShieldCheck className="h-5 w-5" />}
      />
    </div>
  );
}

export function LoginHeroIllustration() {
  const { shouldReduceMotion, x, y, handlePointerMove, reset } = useHeroParallax(12);
  const stageX = useTransform(x, (value) => value * -0.2);
  const stageY = useTransform(y, (value) => value * -0.16);
  const sparkX = useTransform(x, (value) => value * -0.56);
  const sparkY = useTransform(y, (value) => value * -0.48);
  const cardX = useTransform(x, (value) => value * 0.36);
  const cardY = useTransform(y, (value) => value * 0.22);
  const cubeX = useTransform(x, (value) => value * -0.82);
  const cubeY = useTransform(y, (value) => value * 0.54);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(232,239,255,0.56)_34%,transparent_72%)]" />
      <motion.div
        className="absolute inset-x-[10%] bottom-[10%] top-[10%]"
        style={{ x: stageX, y: stageY }}
      >
        <motion.div
          className="absolute inset-0 rounded-[38px] border border-white/70 bg-white/40 shadow-[0_32px_80px_rgba(58,96,186,0.16)] backdrop-blur-[6px]"
          style={{ rotate: -3.5 }}
        />
        <motion.div
          className="absolute left-[7%] top-[6%] h-[78%] w-[84%]"
          style={{ rotate: -4.5 }}
        >
          <ImageSlab
            src={stitchAssets.login.heroRoom}
            className="inset-0"
            imageClassName="scale-[1.18] object-[56%_center]"
          />
        </motion.div>

        <motion.div
          className="absolute left-[8%] top-[16%] flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/88 text-primary shadow-[0_20px_36px_rgba(56,91,172,0.18)]"
          style={{ x: sparkX, y: sparkY }}
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 right-6 max-w-[15rem] rounded-[28px] border border-white/75 bg-white/84 p-6 shadow-[0_24px_56px_rgba(45,74,150,0.18)] backdrop-blur-xl"
        style={{ x: cardX, y: cardY }}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary-container/42 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-xl leading-8 text-foreground">
          Bắt đầu lại từ một nơi ở bạn thực sự muốn quay về.
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Tìm phòng, ghép bạn ở và quay lại đúng hành trình bạn đang theo dõi.
        </p>
      </motion.div>

      {!shouldReduceMotion ? (
        <motion.div
          className="absolute bottom-[18%] left-[7%] h-20 w-20 rounded-[26px] border border-white/65 bg-white/50 shadow-[0_18px_38px_rgba(58,96,186,0.14)] backdrop-blur-lg"
          style={{ x: cubeX, y: cubeY, rotate: -8 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}
