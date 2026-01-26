/**
 * Become Landlord Page
 * Allows users to apply to become a landlord
 * Application is reviewed by admin before approval
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, CheckCircle, Clock, Phone, MapPin, FileText, ArrowLeft, Home, Shield, Users } from 'lucide-react';

export default function BecomeLandlordPage() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        phone: profile?.phone || '',
        address: '',
        propertyCount: '',
        experience: '',
        description: '',
    });

    // Check if already landlord
    if (profile?.role === 'landlord') {
        navigate('/landlord');
        return null;
    }

    // Check if pending approval
    const isPendingApproval = profile?.account_status === 'pending_landlord';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('Vui lòng đăng nhập để tiếp tục');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            // Update user profile with landlord application info
            const { error } = await supabase
                .from('users')
                .update({
                    phone: formData.phone,
                    account_status: 'pending_landlord',
                    preferences: {
                        ...profile?.preferences,
                        landlord_application: {
                            address: formData.address,
                            property_count: formData.propertyCount,
                            experience: formData.experience,
                            description: formData.description,
                            applied_at: new Date().toISOString(),
                        },
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Đơn đăng ký đã được gửi! Admin sẽ xem xét trong 24-48 giờ.');
            // Reload to show pending status
            window.location.reload();
        } catch (error) {
            console.error('Error submitting landlord application:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Pending approval state
    if (isPendingApproval) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="container max-w-2xl mx-auto px-4 py-12">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Về trang chủ
                    </Button>

                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-amber-600" />
                            </div>
                            <CardTitle className="text-2xl text-amber-800">
                                Đang chờ phê duyệt
                            </CardTitle>
                            <CardDescription className="text-amber-700 text-base">
                                Đơn đăng ký của bạn đang được xem xét
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-gray-600">
                                Chúng tôi sẽ xem xét thông tin của bạn và phản hồi trong vòng 24-48 giờ làm việc.
                                Bạn sẽ nhận được thông báo qua email khi có kết quả.
                            </p>
                            <div className="flex justify-center gap-4 pt-4">
                                <Button onClick={() => navigate('/')} variant="outline">
                                    <Home className="w-4 h-4 mr-2" />
                                    Về trang chủ
                                </Button>
                                <Button onClick={() => navigate('/search')}>
                                    Tìm phòng
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container max-w-4xl mx-auto px-4 py-12">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>

                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-lg">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Trở thành Chủ trọ trên RoomZ
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Đăng ký để đăng tin cho thuê phòng, quản lý khách thuê và tiếp cận hàng nghìn sinh viên đang tìm phòng.
                    </p>
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Tiếp cận khách thuê</h3>
                            <p className="text-sm text-gray-600">
                                Hàng nghìn sinh viên đang tìm phòng mỗi ngày trên RoomZ
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Xác thực uy tín</h3>
                            <p className="text-sm text-gray-600">
                                Tin đăng được xác thực, tăng độ tin cậy với khách thuê
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Quản lý dễ dàng</h3>
                            <p className="text-sm text-gray-600">
                                Dashboard quản lý phòng, tin nhắn và thanh toán tiện lợi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Application Form */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Thông tin đăng ký
                        </CardTitle>
                        <CardDescription>
                            Điền thông tin để chúng tôi xác minh và kích hoạt tài khoản chủ trọ
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        Số điện thoại liên hệ
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="0912 345 678"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="propertyCount" className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-500" />
                                        Số lượng phòng/căn hộ cho thuê
                                    </Label>
                                    <Input
                                        id="propertyCount"
                                        type="number"
                                        placeholder="Ví dụ: 5"
                                        min="1"
                                        value={formData.propertyCount}
                                        onChange={(e) => setFormData({ ...formData, propertyCount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    Địa chỉ tài sản cho thuê
                                </Label>
                                <Input
                                    id="address"
                                    placeholder="Số nhà, đường, quận/huyện, thành phố"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experience">Kinh nghiệm cho thuê</Label>
                                <Input
                                    id="experience"
                                    placeholder="Ví dụ: 3 năm kinh nghiệm cho thuê phòng trọ"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả thêm (tùy chọn)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Mô tả về tài sản cho thuê hoặc thông tin bổ sung..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Gửi đơn đăng ký
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Admin sẽ xem xét và phê duyệt trong vòng 24-48 giờ làm việc
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
