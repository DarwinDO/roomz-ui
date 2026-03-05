/**
 * React Error Boundary
 * Catches JavaScript errors in child components and displays fallback UI
 * Prevents entire app from crashing due to errors in one component
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('[ErrorBoundary] Caught error:', error);
            console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
        }

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // TODO: Send error to error tracking service (Sentry, etc.)
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    public componentDidUpdate(prevProps: Props) {
        // Reset error state when children change (if enabled)
        if (
            this.state.hasError &&
            this.props.resetOnPropsChange &&
            prevProps.children !== this.props.children
        ) {
            this.setState({ hasError: false, error: null, errorInfo: null });
        }
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Đã xảy ra lỗi
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Rất tiếc, có lỗi không mong muốn đã xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 text-left">
                                <details className="bg-gray-100 rounded p-3 text-sm">
                                    <summary className="font-medium text-gray-700 cursor-pointer">
                                        Chi tiết lỗi (chỉ hiển thị trong development)
                                    </summary>
                                    <pre className="mt-2 text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                                        {this.state.error.toString()}
                                        {'\n'}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Thử lại
                            </Button>

                            <Button
                                onClick={this.handleReload}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tải lại trang
                            </Button>

                            <Button
                                onClick={this.handleGoHome}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Về trang chủ
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC to wrap components with Error Boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary {...errorBoundaryProps}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
