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
                <View className="flex-1 items-center justify-center bg-background px-8">
                    <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
                        <AlertTriangle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-bold text-text-primary text-center mb-2">
                        Đã có lỗi xảy ra
                    </Text>
                    <Text className="text-sm text-text-secondary text-center mb-6">
                        {this.state.error?.message || 'Ứng dụng gặp sự cố không mong muốn'}
                    </Text>
                    <TouchableOpacity
                        onPress={this.resetError}
                        className="flex-row items-center bg-primary-500 px-6 py-3 rounded-xl"
                    >
                        <RotateCcw size={20} color="white" />
                        <Text className="text-white font-medium ml-2">Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}
