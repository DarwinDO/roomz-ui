/**
 * MyRoommateProfile - User's own roommate profile management
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Edit2,
    MapPin,
    Calendar,
    Wallet,
    Briefcase,
    User,
    Trash2,
    Loader2,
} from 'lucide-react';
import { useRoommateProfileQuery } from '@/hooks/useRoommatesQuery';
import { VisibilityToggle } from './VisibilityToggle';
import { PageLoading } from '../common/LoadingSpinner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function MyRoommateProfile() {
    const navigate = useNavigate();
    const { profile, loading, setStatus, deleteProfile } = useRoommateProfileQuery();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteProfile();
            // Navigate to setup since profile is deleted
            navigate('/roommates/setup');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <PageLoading message="Đang tải hồ sơ của bạn..." />;
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Chưa có profile</h2>
                    <p className="text-muted-foreground mb-4">
                        Tạo profile để bắt đầu tìm bạn cùng phòng
                    </p>
                    <Button onClick={() => navigate('/roommates')}>
                        Tạo profile ngay
                    </Button>
                </Card>
            </div>
        );
    }

    const occupationLabels: Record<string, string> = {
        student: 'Sinh viên',
        worker: 'Đi làm',
        freelancer: 'Freelancer',
        other: 'Khác',
    };

    const genderLabels: Record<string, string> = {
        male: 'Nam',
        female: 'Nữ',
        other: 'Khác',
        any: 'Không phân biệt',
    };

    return (
        <>
            {/* Header with Edit Button */}
            <div className="flex items-center justify-end mb-6">
                <Button variant="outline" size="sm" onClick={() => navigate('/roommates/edit')}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                </Button>
            </div>

            {/* Visibility Status */}
            <div className="mb-6">
                <VisibilityToggle
                    status={profile.status}
                    onStatusChange={setStatus}
                />
            </div>

            {/* Profile Info */}
            <Card className="p-6 space-y-6">
                {/* Bio */}
                {profile.bio && (
                    <div>
                        <h3 className="font-semibold mb-2">Giới thiệu</h3>
                        <p className="text-muted-foreground">{profile.bio}</p>
                    </div>
                )}

                <Separator />

                {/* Location */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">Khu vực tìm phòng</p>
                        <p className="text-sm text-muted-foreground">
                            {profile.district ? `${profile.district}, ` : ''}{profile.city}
                            {' '}• {profile.search_radius_km}km
                        </p>
                    </div>
                </div>

                {/* Budget */}
                {(profile.budget_min || profile.budget_max) && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium">Ngân sách</p>
                            <p className="text-sm text-muted-foreground">
                                {profile.budget_min ? `${(profile.budget_min / 1000000).toFixed(1)}` : '0'}
                                {' - '}
                                {profile.budget_max ? `${(profile.budget_max / 1000000).toFixed(1)}` : '∞'} triệu/tháng
                            </p>
                        </div>
                    </div>
                )}

                {/* Move-in Date */}
                {profile.move_in_date && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium">Ngày dọn vào</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(profile.move_in_date).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Occupation */}
                {profile.occupation && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium">Nghề nghiệp</p>
                            <p className="text-sm text-muted-foreground">
                                {occupationLabels[profile.occupation] || profile.occupation}
                            </p>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {profile.age && (
                        <div>
                            <span className="text-muted-foreground">Tuổi:</span>
                            <span className="ml-2 font-medium">{profile.age}</span>
                        </div>
                    )}
                    {profile.gender && (
                        <div>
                            <span className="text-muted-foreground">Giới tính:</span>
                            <span className="ml-2 font-medium">{genderLabels[profile.gender]}</span>
                        </div>
                    )}
                    <div>
                        <span className="text-muted-foreground">Muốn ở cùng:</span>
                        <span className="ml-2 font-medium">{genderLabels[profile.preferred_gender]}</span>
                    </div>
                </div>

                {/* Hobbies */}
                {profile.hobbies && profile.hobbies.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-3">Sở thích</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.hobbies.map((hobby) => (
                                    <Badge key={hobby} variant="secondary">
                                        {hobby}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Delete Profile */}
            <div className="mt-6">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa profile tìm bạn cùng phòng
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xóa profile?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Hành động này sẽ xóa vĩnh viễn profile tìm bạn cùng phòng của bạn.
                                Bạn sẽ không còn xuất hiện trong kết quả tìm kiếm.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600"
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Xóa profile
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
