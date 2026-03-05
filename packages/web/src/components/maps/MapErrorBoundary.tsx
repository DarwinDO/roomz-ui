/**
 * MapErrorBoundary - Error Boundary cho Google Maps components
 * Xử lý lỗi khi Google Maps API không load được
 */
import { Component, type ReactNode } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Map Error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-muted/30 rounded-2xl border border-border p-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Không thể tải bản đồ</h3>
                    <p className="text-muted-foreground text-sm mb-4 text-center">
                        {this.state.error?.message || 'Có lỗi xảy ra khi tải Google Maps'}
                    </p>
                    <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Thử lại
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}