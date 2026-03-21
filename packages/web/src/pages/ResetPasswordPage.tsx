import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RommzLogo from "@/assets/logo/rommz-logo.png";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

// Skeleton Component
const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
);

const ResetPasswordSkeleton = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
    </div>
);

const LogoSkeleton = () => (
    <Skeleton className="h-12 w-32 mx-auto" />
);

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [hasResetToken, setHasResetToken] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Check if user has a valid reset token using onAuthStateChange
    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && mounted) {
                setHasResetToken(true);
                setIsPageLoading(false);
            }
        };

        // Listen for auth state changes to detect recovery token
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === "PASSWORD_RECOVERY" || session) {
                setHasResetToken(true);
                setError("");
            } else {
                setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
            }
            setIsPageLoading(false);
        });

        checkSession();

        // Timeout for skeleton if no auth event fires
        const timeout = setTimeout(() => {
            if (mounted && isPageLoading) {
                setIsPageLoading(false);
            }
        }, 1000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!password.trim()) {
            setError("Vui lòng nhập mật khẩu mới");
            return;
        }

        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại";
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
                                        <Skeleton className="h-8 w-40 mx-auto mb-2" />
                                        <Skeleton className="h-4 w-56 mx-auto" />
                                    </div>
                                    <ResetPasswordSkeleton />
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
                                            Đặt lại mật khẩu
                                        </h1>
                                        <p className="text-muted-foreground text-sm">
                                            Tạo mật khẩu mới cho tài khoản của bạn
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
                                                        Đặt lại mật khẩu thành công!
                                                    </h2>
                                                    <p className="text-muted-foreground text-sm">
                                                        Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại bằng mật khẩu mới.
                                                    </p>
                                                </div>
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    <Button
                                                        onClick={() => navigate("/login")}
                                                        className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200"
                                                    >
                                                        Đăng nhập
                                                    </Button>
                                                </motion.div>
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
                                                    <Label htmlFor="password">Mật khẩu mới</Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                        <Input
                                                            id="password"
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="rounded-xl h-12 pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            required
                                                            minLength={8}
                                                            disabled={loading || !hasResetToken}
                                                        />
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === "Escape") {
                                                                    setShowPassword(false);
                                                                }
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                            tabIndex={-1}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="w-5 h-5" />
                                                            ) : (
                                                                <Eye className="w-5 h-5" />
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                    <PasswordStrengthIndicator password={password} />
                                                </motion.div>

                                                <motion.div variants={itemVariants} className="space-y-2">
                                                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                        <Input
                                                            id="confirm-password"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="rounded-xl h-12 pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            required
                                                            minLength={8}
                                                            disabled={loading || !hasResetToken}
                                                        />
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                            tabIndex={-1}
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff className="w-5 h-5" />
                                                            ) : (
                                                                <Eye className="w-5 h-5" />
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <motion.div whileHover={{ scale: loading || !hasResetToken ? 1 : 1.02 }} whileTap={{ scale: loading || !hasResetToken ? 1 : 0.98 }}>
                                                        <Button
                                                            type="submit"
                                                            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl touch-target transition-all duration-200"
                                                            disabled={loading || !hasResetToken}
                                                        >
                                                            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                                                        </Button>
                                                    </motion.div>
                                                </motion.div>

                                                {!hasResetToken && (
                                                    <motion.div variants={itemVariants} className="text-center">
                                                        <Link
                                                            to="/forgot-password"
                                                            className="text-sm text-primary hover:underline transition-all duration-200"
                                                        >
                                                            Yêu cầu liên kết mới
                                                        </Link>
                                                    </motion.div>
                                                )}
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
