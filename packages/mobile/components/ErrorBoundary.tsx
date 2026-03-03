import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 32 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <AlertTriangle size={40} color="#ef4444" />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8 }}>
                        Đã có lỗi xảy ra
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
                        {this.state.error?.message || 'Ứng dụng gặp sự cố không mong muốn'}
                    </Text>
                    <TouchableOpacity
                        onPress={this.resetError}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a9d6a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    >
                        <RotateCcw size={20} color="white" />
                        <Text style={{ color: 'white', fontWeight: '500', marginLeft: 8 }}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}
