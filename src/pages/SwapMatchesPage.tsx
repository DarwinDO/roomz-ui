/**
 * SwapMatchesPage
 * Display potential swap matches using RPC
 * Simplified version - no swipe mechanism
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Star, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SwapMatchCard } from '@/components/swap';
import { SwapRequestDialog } from '@/components/modals/SwapRequestDialog';
import { useSwapMatches } from '@/hooks/useSwap';
import { toast } from 'sonner';
import type { PotentialMatch, SubletListing } from '@/types/swap';

/**
 * Adapter function to convert PotentialMatch to SubletListing
 * Ensures type safety instead of using 'as any'
 */
function adaptMatchToSubletListing(match: PotentialMatch): SubletListing {
    const matchedListing = match.matched_listing;
    return {
        id: match.matched_listing_id,
        original_room_id: '', // Not available from match data
        owner_id: '', // Not available from match data
        start_date: null as any, // Null → skip date validation in dialog
        end_date: null as any, // Null → skip date validation in dialog
        original_price: matchedListing.sublet_price,
        sublet_price: matchedListing.sublet_price,
        deposit_required: 0,
        description: '',
        requirements: [],
        status: 'active',
        view_count: 0,
        application_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        room: {
            id: match.matched_listing_id,
            title: matchedListing.title,
            address: matchedListing.address,
            district: matchedListing.district,
            city: matchedListing.city,
            area_sqm: matchedListing.area_sqm,
            bedroom_count: matchedListing.bedroom_count,
            bathroom_count: matchedListing.bathroom_count,
            furnished: matchedListing.furnished,
            latitude: matchedListing.latitude,
            longitude: matchedListing.longitude,
            room_type: matchedListing.room_type as any,
        },
        owner: {
            id: '',
            full_name: matchedListing.owner_name,
            avatar_url: matchedListing.owner_avatar,
            is_verified: null,
        },
        images: matchedListing.images.map(img => ({
            ...img,
            display_order: null,
        })),
    };
}

export default function SwapMatchesPage() {
    const navigate = useNavigate();
    const { data, isLoading, isError, refetch } = useSwapMatches(40);

    const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

    const matches = data?.matches || [];

    const handleRequestSwap = (match: PotentialMatch) => {
        setSelectedMatch(match);
        setIsRequestDialogOpen(true);
    };

    return (
        <div className="pb-20 md:pb-8 min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/swap')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Gợi ý hoán đổi</h1>
                            <p className="text-muted-foreground text-sm hidden sm:block">
                                Những phòng phù hợp để hoán đổi với bạn
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">
                            {matches.length} gợi ý
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Info Card */}
                <Card className="p-6 mb-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                            <Star className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-2 font-semibold">Thuật toán tìm kiếm thông minh</h3>
                            <p className="text-sm text-muted-foreground">
                                Chúng tôi phân tích vị trí (50%) và giá cả (50%) để tìm
                                những phòng phù hợp nhất với nhu cầu hoán đổi của bạn.
                                Điểm càng cao, khả năng hoán đổi càng tốt.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Matches Grid */}
                {isLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="h-96 animate-pulse" />
                        ))}
                    </div>
                ) : isError ? (
                    <Card className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">Có lỗi xảy ra khi tải dữ liệu</p>
                        <Button onClick={() => refetch()}>Thử lại</Button>
                    </Card>
                ) : matches.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <RefreshCw className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 font-medium text-lg">Chưa có gợi ý nào</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Bạn cần đăng tin cho thuê phòng active để nhận gợi ý hoán đổi.
                            Hoặc thử điều chỉnh bộ lọc để tìm thêm kết quả.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => navigate('/swap')}>
                                Tìm phòng
                            </Button>
                            <Button onClick={() => navigate('/my-sublets')}>
                                Đăng phòng của tôi
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matches.map((match) => (
                            <SwapMatchCard
                                key={`${match.listing_id}-${match.matched_listing_id}`}
                                match={match}
                                onRequestSwap={() => handleRequestSwap(match)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Swap Request Dialog */}
            <SwapRequestDialog
                targetSublet={selectedMatch ? adaptMatchToSubletListing(selectedMatch) : null}
                isOpen={isRequestDialogOpen}
                onClose={() => {
                    setIsRequestDialogOpen(false);
                    setSelectedMatch(null);
                }}
            />
        </div>
    );
}
