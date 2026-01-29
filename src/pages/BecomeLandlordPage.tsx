import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { BecomeLandlordFormData } from './become-landlord/types';

// Components
import { BecomeLandlordIntro } from './become-landlord/components/BecomeLandlordIntro';
import { BecomeLandlordForm } from './become-landlord/components/BecomeLandlordForm';
import { BecomeLandlordPending } from './become-landlord/components/BecomeLandlordPending';

export default function BecomeLandlordPage() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<BecomeLandlordFormData>({
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
                        ...(profile?.preferences as object),
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
        return <BecomeLandlordPending />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <BecomeLandlordIntro />

                <BecomeLandlordForm
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}
