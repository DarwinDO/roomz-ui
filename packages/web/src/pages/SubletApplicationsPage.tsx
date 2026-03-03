/**
 * SubletApplicationsPage
 * View and manage applications for a specific sublet listing
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Check, X, MessageCircle, Loader2, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubletApplications, useRespondToApplication } from '@/hooks/useSublets';
import { toast } from 'sonner';
import { startConversation } from '@/services/chat';
import { useAuth } from '@/contexts';
import type { SubletApplication } from '@roomz/shared/types/swap';

export default function SubletApplicationsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: applications, isLoading, error } = useSubletApplications(id || '');
    const respondToApplication = useRespondToApplication();

    const [selectedApp, setSelectedApp] = useState<SubletApplication | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

    const handleApprove = async (app: SubletApplication) => {
        try {
            await respondToApplication.mutateAsync({
                applicationId: app.id,
                status: 'approved',
            });
            toast.success('Đã duyệt', {
                description: 'Đơn đăng ký đã được phê duyệt.',
            });
        } catch (error) {
            toast.error('Không thể phê duyệt đơn.');
        }
    };

    const handleReject = async (app: SubletApplication) => {
        setSelectedApp(app);
        setRejectDialogOpen(true);
    };

    const confirmReject = async () => {
        if (!selectedApp) return;
        try {
            await respondToApplication.mutateAsync({
                applicationId: selectedApp.id,
                status: 'rejected',
            });
            toast.success('Đã từ chối', {
                description: 'Đơn đăng ký đã bị từ chối.',
            });
        } catch (error) {
            toast.error('Không thể từ chối đơn.');
        } finally {
            setRejectDialogOpen(false);
            setSelectedApp(null);
        }
    };

    const handleMessage = async (app: SubletApplication) => {
        const recipientId = app.applicant?.id || app.applicant_id;
        if (!recipientId || !user) {
            toast.error('Không thể nhắn tin — không tìm thấy thông tin người đăng ký.');
            return;
        }
        try {
            const conversation = await startConversation(recipientId, user.id);
            navigate(`/messages/${conversation.id}`);
        } catch {
            toast.error('Không thể tạo cuộc trò chuyện.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="p-8 text-center max-w-md">
                    <p className="text-destructive mb-2">Không thể tải danh sách đơn đăng ký</p>
                    <Button onClick={() => navigate('/my-sublets')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </Card>
            </div>
        );
    }

    const pendingApps = applications?.filter((a: SubletApplication) => a.status === 'pending') || [];
    const otherApps = applications?.filter((a: SubletApplication) => a.status !== 'pending') || [];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/my-sublets')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Đơn đăng ký</h1>
                            <p className="text-muted-foreground text-sm">
                                {applications?.length || 0} đơn cho phòng này
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{pendingApps.length} chờ duyệt</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {applications?.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 font-medium">Chưa có đơn đăng ký</h3>
                        <p className="text-muted-foreground">
                            Tin đăng của bạn chưa có ai đăng ký thuê.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Pending Applications */}
                        {pendingApps.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Badge variant="secondary">{pendingApps.length}</Badge>
                                    Chờ duyệt
                                </h2>
                                {pendingApps.map((app: SubletApplication) => (
                                    <ApplicationCard
                                        key={app.id}
                                        app={app}
                                        onApprove={() => handleApprove(app)}
                                        onReject={() => handleReject(app)}
                                        onMessage={() => handleMessage(app)}
                                        isProcessing={respondToApplication.isPending}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Separator */}
                        {pendingApps.length > 0 && otherApps.length > 0 && (
                            <Separator className="my-6" />
                        )}

                        {/* Other Applications */}
                        {otherApps.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-muted-foreground">
                                    Đã xử lý ({otherApps.length})
                                </h2>
                                {otherApps.map((app: SubletApplication) => (
                                    <ApplicationCard
                                        key={app.id}
                                        app={app}
                                        onMessage={() => handleMessage(app)}
                                        isProcessing={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reject Confirmation Dialog */}
            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Từ chối đơn đăng ký?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Người đăng ký sẽ nhận được thông báo từ chối. Bạn có chắc chắn?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReject}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Từ chối
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </div>
    );
}

// Application Card Component
interface ApplicationCardProps {
    app: SubletApplication;
    onApprove?: () => void;
    onReject?: () => void;
    onMessage: () => void;
    isProcessing: boolean;
}

function ApplicationCard({ app, onApprove, onReject, onMessage, isProcessing }: ApplicationCardProps) {
    const applicant = app.applicant;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã duyệt</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Từ chối</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Avatar */}
                <Avatar className="w-14 h-14">
                    <AvatarImage src={applicant?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {applicant?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h3 className="font-semibold text-lg">
                                {applicant?.full_name || 'Người dùng'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Đăng ký lúc {new Date(app.created_at).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                        {getStatusBadge(app.status)}
                    </div>

                    {app.message && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm italic">"{app.message}"</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onMessage}
                        >
                            <MessageCircle className="w-4 h-4 mr-1.5" />
                            Nhắn tin
                        </Button>

                        {app.status === 'pending' && onApprove && onReject && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-500 text-green-600 hover:bg-green-50"
                                    onClick={onApprove}
                                    disabled={isProcessing}
                                >
                                    <Check className="w-4 h-4 mr-1.5" />
                                    Duyệt
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                    onClick={onReject}
                                    disabled={isProcessing}
                                >
                                    <X className="w-4 h-4 mr-1.5" />
                                    Từ chối
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
