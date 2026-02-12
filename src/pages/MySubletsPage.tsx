/**
 * MySubletsPage
 * Manage user's sublet listings
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Home, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SubletCard } from '@/components/swap';
import { useMySublets, useDeleteSublet } from '@/hooks/useSublets';
import { toast } from 'sonner';
import type { SubletListing } from '@/types/swap';

export default function MySubletsPage() {
    const navigate = useNavigate();

    const { data: sublets, isLoading, isError } = useMySublets();
    const deleteSublet = useDeleteSublet();

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const activeSublets = sublets?.filter((s) => s.status === 'active') || [];
    const pendingSublets: SubletListing[] = []; // Simplified - no pending status
    const expiredSublets =
        sublets?.filter((s) => s.status === 'cancelled') || [];

    const handleEdit = (sublet: SubletListing) => {
        navigate(`/sublet/${sublet.id}/edit`);
    };

    const handleDelete = async (sublet: SubletListing) => {
        if (!confirm('Bạn có chắc muốn xóa tin đăng này?')) return;

        setDeletingId(sublet.id);
        try {
            await deleteSublet.mutateAsync(sublet.id);
            toast.success('Đã xóa', {
                description: 'Tin đăng đã được xóa thành công.',
            });
        } catch (error) {
            toast.error('Lỗi', {
                description: 'Không thể xóa tin đăng.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleViewApplications = (sublet: SubletListing) => {
        navigate(`/sublet/${sublet.id}/applications`);
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
                            <h1 className="text-xl font-bold">Tin đăng của tôi</h1>
                            <p className="text-muted-foreground text-sm hidden sm:block">
                                Quản lý phòng cho thuê ngắn hạn
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/create-sublet')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Đăng phòng mới
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeSublets.length}</p>
                                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingSublets.length}</p>
                                <p className="text-xs text-muted-foreground">Chờ duyệt</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {sublets?.reduce((acc, s) => acc + (s.application_count || 0), 0) || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Đơn đăng ký</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger value="active" className="rounded-lg">
                            Đang hoạt động
                            {activeSublets.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {activeSublets.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-lg">
                            Chờ duyệt
                            {pendingSublets.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {pendingSublets.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="expired" className="rounded-lg">
                            Đã kết thúc
                        </TabsTrigger>
                    </TabsList>

                    {/* Active */}
                    <TabsContent value="active" className="space-y-4">
                        {isLoading ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2].map((i) => (
                                    <Card key={i} className="h-80 animate-pulse" />
                                ))}
                            </div>
                        ) : activeSublets.length === 0 ? (
                            <Card className="p-12 text-center">
                                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Home className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 font-medium">Chưa có tin đăng nào</h3>
                                <p className="text-muted-foreground mb-4">
                                    Đăng phòng của bạn để tìm ngườ thuê phù hợp.
                                </p>
                                <Button onClick={() => navigate('/create-sublet')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Đăng phòng ngay
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeSublets.map((sublet) => (
                                    <div key={sublet.id} className="relative group">
                                        <SubletCard sublet={sublet} />
                                        {/* Action Buttons */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleViewApplications(sublet)}
                                            >
                                                <Users className="w-4 h-4 mr-1" />
                                                {sublet.application_count || 0}
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={() => handleEdit(sublet)}>
                                                Sửa
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(sublet)}
                                                disabled={deletingId === sublet.id}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Pending */}
                    <TabsContent value="pending" className="space-y-4">
                        {pendingSublets.length === 0 ? (
                            <Card className="p-12 text-center">
                                <p className="text-muted-foreground">Không có tin đăng nào đang chờ duyệt</p>
                            </Card>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingSublets.map((sublet) => (
                                    <SubletCard key={sublet.id} sublet={sublet} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Expired */}
                    <TabsContent value="expired" className="space-y-4">
                        {expiredSublets.length === 0 ? (
                            <Card className="p-12 text-center">
                                <p className="text-muted-foreground">Chưa có tin đăng nào đã kết thúc</p>
                            </Card>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {expiredSublets.map((sublet) => (
                                    <SubletCard key={sublet.id} sublet={sublet} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
