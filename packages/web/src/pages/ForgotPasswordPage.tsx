import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RommzLogo from "@/assets/logo/rommz-logo.png";

// Skeleton Component
const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
);

const ForgotPasswordSkeleton = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
    </div>
);

const LogoSkeleton = () => (
    <Skeleton className="h-12 w-32 mx-auto" />
);

const RATE_LIMIT_SECONDS = 60;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(0);

    // Simulate initial loading
    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Countdown timer for rate limiting
    useEffect(() => {
        if (!lastSubmitTime) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, RATE_LIMIT_SECONDS - Math.floor((Date.now() - lastSubmitTime) / 1000));
            setCountdown(remaining);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastSubmitTime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        // Rate limiting check
        if (lastSubmitTime && Date.now() - lastSubmitTime < RATE_LIMIT_SECONDS * 1000) {
            const remaining = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (Date.now() - lastSubmitTime)) / 1000);
            setError(`Vui lòng đợi ${remaining} giây trước khi gửi lại`);
            return;
        }

        // Basic validation
        if (!email.trim()) {
            setError("Vui lòng nhập email");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Email không hợp lệ");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setLastSubmitTime(Date.now());
            setCountdown(RATE_LIMIT_SECONDS);
            setSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Gửi yêu cầu thất bại";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        },
    };

    const errorVariants = {
        hidden: { opacity: 0, x: -20, scale: 0.95 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
            },
        },
        exit: {
            opacity: 0,
            x: 20,
            transition: {
                duration: 0.2,
            },
        },
    };

    const successVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 150,
                damping: 15,
            },
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-b from-accent/30 to-background flex items-center justify-center p-4"
        >
            <div className="w-full max-w-md">
                {/* Logo */}
                <AnimatePresence mode="wait">
                    {isPageLoading ? (
                        <motion.div
                            key="logo-skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-3 mb-8"
                        >
                            <LogoSkeleton />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="flex items-center justify-center gap-3 mb-8"
                        >
                            <img src={RommzLogo} alt="rommz" className="h-12 w-auto object-contain" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                >
                    <Card className="p-8 rounded-2xl shadow-soft-lg border border-border bg-card">
                        <AnimatePresence mode="wait">
                            {isPageLoading ? (
                                <motion.div
                                    key="skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Skeleton className="h-4 w-40 mb-6" />
                                    <div className="text-center mb-6">
                                        <Skeleton className="h-8 w-48 mx-auto mb-2" />
                                        <Skeleton className="h-4 w-64 mx-auto" />
                                    </div>
                                    <ForgotPasswordSkeleton />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {/* Back Button */}
                                    <motion.div variants={itemVariants}>
                                        <Link
                                            to="/login"
                                            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-1" />
                                            Quay lại đăng nhập
                                        </Link>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="text-center mb-6">
                                        <h1 className="text-2xl font-semibold tracking-tight mb-2">
                                            Quên mật khẩu?
                                        </h1>
                                        <p className="text-muted-foreground text-sm">
                                            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
                                        </p>
                                    </motion.div>

                                    <AnimatePresence mode="wait">
                                        {success ? (
                                            <motion.div
                                                key="success"
                                                variants={successVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="text-center space-y-6"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                                                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                                                >
                                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                                </motion.div>
                                                <div>
                                                    <h2 className="text-lg font-semibold text-green-700 mb-2">
                                                        Kiểm tra email của bạn
                                                    </h2>
                                                    <p className="text-muted-foreground text-sm">
                                                        Chúng tôi đã gửi liên kết đặt lại mật khẩu đến{" "}
                                                        <span className="font-medium text-foreground">{email}</span>
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                        <Button
                                                            onClick={() => navigate("/login")}
                                                            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200"
                                                        >
                                                            Quay lại đăng nhập
                                                        </Button>
                                                    </motion.div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Không nhận được email? Kiểm tra thư mục spam hoặc{" "}
                                                        <button
                                                            onClick={() => setSuccess(false)}
                                                            className="text-primary hover:underline transition-all duration-200"
                                                        >
                                                            thử lại
                                                        </button>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.form
                                                key="form"
                                                onSubmit={handleSubmit}
                                                className="space-y-4"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                <AnimatePresence mode="wait">
                                                    {error && (
                                                        <motion.div
                                                            key="error"
                                                            variants={errorVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className="bg-destructive/5 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2"
                                                        >
                                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                                            <span className="text-sm">{error}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <motion.div variants={itemVariants} className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="email@example.com"
                                                            className="rounded-xl h-12 pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            required
                                                            autoFocus
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <motion.div whileHover={{ scale: loading || countdown > 0 ? 1 : 1.02 }} whileTap={{ scale: loading || countdown > 0 ? 1 : 0.98 }}>
                                                        <Button
                                                            type="submit"
                                                            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl touch-target transition-all duration-200"
                                                            disabled={loading || countdown > 0}
                                                        >
                                                            {loading ? "Đang gửi..." : countdown > 0 ? `Đợi ${countdown}s` : "Gửi liên kết đặt lại mật khẩu"}
                                                        </Button>
                                                    </motion.div>
                                                </motion.div>

                                                <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
                                                    Bạn nhớ mật khẩu?{" "}
                                                    <Link to="/login" className="text-primary hover:underline transition-all duration-200">
                                                        Đăng nhập
                                                    </Link>
                                                </motion.p>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
