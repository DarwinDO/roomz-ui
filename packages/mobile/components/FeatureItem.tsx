import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';

interface FeatureItemProps {
    text: string;
}

/**
 * Feature item with check icon for premium screen
 */
export function FeatureItem({ text }: FeatureItemProps) {
    return (
        <View className="flex-row items-center gap-3 py-2">
            <View className="w-5 h-5 rounded-full bg-green-100 items-center justify-center">
                <Check size={12} color="#22c55e" strokeWidth={3} />
            </View>
            <Text className="text-text-primary flex-1">{text}</Text>
        </View>
    );
}
