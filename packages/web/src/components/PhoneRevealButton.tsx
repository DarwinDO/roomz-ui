/**
 * PhoneRevealButton
 * Premium-gated phone number reveal component
 */

import { useState } from 'react';
import { Phone, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoomContact } from '@/services/rooms';
import { useNavigate } from 'react-router';
import { UPGRADE_SOURCES } from '@roomz/shared/constants/tracking';

interface PhoneRevealButtonProps {
    roomId: string;
    className?: string;
}

export function PhoneRevealButton({ roomId, className = '' }: PhoneRevealButtonProps) {
    const navigate = useNavigate();
    const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
    const [isMasked, setIsMasked] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReveal = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await getRoomContact(roomId);
            setRevealedPhone(result.phone);
            setIsMasked(result.isMasked);
        } catch (err) {
            console.error('Failed to reveal phone:', err);
            setError('Không thể lấy thông tin liên hệ');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = () => {
        navigate(`/payment?source=${UPGRADE_SOURCES.PHONE_REVEAL}`);
    };

    // If already revealed and not masked - show full phone
    if (revealedPhone && !isMasked) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Phone className="w-4 h-4 text-green-600" />
                <a href={`tel:${revealedPhone}`} className="font-medium text-green-700 hover:underline">
                    {revealedPhone}
                </a>
            </div>
        );
    }

    // If revealed but masked - show upgrade prompt
    if (revealedPhone && isMasked) {
        return (
            <div className={`space-y-2 ${className}`}>
                <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="font-mono">{revealedPhone}</span>
                </div>
                <Button
                    onClick={handleUpgrade}
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 text-primary hover:bg-primary/5"
                >
                    <Lock className="w-3 h-3 mr-2" />
                    Nâng cấp Premium để xem đầy đủ
                </Button>
            </div>
        );
    }

    // Initial state - show reveal button
    return (
        <div className={className}>
            {error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : (
                <Button
                    onClick={handleReveal}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Phone className="w-4 h-4" />
                    )}
                    Xem SĐT
                </Button>
            )}
        </div>
    );
}
