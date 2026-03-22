/**
 * MySubletsPage
 * Manage the user's short-stay listings.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { SubletCard } from '@/components/swap';
import { useDeleteSublet, useMySublets } from '@/hooks/useSublets';
import { toast } from 'sonner';
import type { SubletListing, SubletListingWithDetails } from '@roomz/shared/types/swap';

export default function MySubletsPage() {
  const navigate = useNavigate();
  const { data: sublets, isLoading, isError } = useMySublets();
  const deleteSublet = useDeleteSublet();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const detailedSublets = (sublets as SubletListingWithDetails[]) || [];
  const activeSublets = detailedSublets.filter((sublet) => sublet.status === 'active');
  const endedSublets = detailedSublets.filter((sublet) => sublet.status === 'cancelled');

  const handleEdit = (sublet: SubletListing) => {
    navigate(`/sublet/${sublet.id}/edit`);
  };

  const handleDelete = async (subletId: string) => {
    setDeleteTarget(null);
    setDeletingId(subletId);

    try {
      await deleteSublet.mutateAsync(subletId);
      toast.success('Đã xóa tin', {
        description: 'Chỗ ở ngắn hạn đã được gỡ khỏi danh sách của bạn.',
      });
    } catch {
      toast.error('Không thể xóa tin', {
        description: 'Vui lòng thử lại sau.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewApplications = (sublet: SubletListing) => {
    navigate(`/sublet/${sublet.id}/applications`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="scroll-lock-shell sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/swap')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  navigate('/swap');
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Chỗ ở ngắn hạn của tôi</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Quản lý chỗ ở ngắn hạn, đơn quan tâm và những khoảng thời gian còn trống.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/create-sublet')}>
            <Plus className="mr-2 h-4 w-4" />
            Đăng tin mới
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSublets.length}</p>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{detailedSublets.reduce((total, sublet) => total + (sublet.application_count || 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Đơn quan tâm</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mx-auto mb-8 grid w-full max-w-sm grid-cols-2 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="active" className="rounded-lg">
              Đang hoạt động
              {activeSublets.length > 0 ? (
                <Badge variant="secondary" className="ml-2">{activeSublets.length}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="ended" className="rounded-lg">
              Đã kết thúc
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((item) => (
                  <Card key={item} className="h-80 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Card className="p-10 text-center">
                <p className="mb-4 text-muted-foreground">Không thể tải danh sách tin ở ngắn hạn của bạn.</p>
                <Button onClick={() => navigate(0)}>Tải lại</Button>
              </Card>
            ) : activeSublets.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Home className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Bạn chưa có tin nào đang hoạt động</h3>
                <p className="mb-4 text-muted-foreground">
                  Đăng chỗ ở ngắn hạn đầu tiên để nhận đơn quan tâm hoặc xem thêm các cơ hội hoán đổi phụ trợ.
                </p>
                <Button onClick={() => navigate('/create-sublet')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Đăng chỗ ở ngắn hạn
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeSublets.map((sublet) => (
                  <div key={sublet.id} className="flex flex-col">
                    <SubletCard sublet={sublet} />
                    <div className="mt-2 flex items-center gap-2 px-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewApplications(sublet)}>
                        <Users className="mr-1.5 h-4 w-4" />
                        Đơn quan tâm
                        <Badge variant="secondary" className="ml-1.5">
                          {sublet.application_count || 0}
                        </Badge>
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(sublet)}>
                        Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(sublet.id)}
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

          <TabsContent value="ended" className="space-y-4">
            {endedSublets.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">Chưa có tin ở ngắn hạn nào đã kết thúc.</Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {endedSublets.map((sublet) => (
                  <SubletCard key={sublet.id} sublet={sublet} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tin ở ngắn hạn?</AlertDialogTitle>
            <AlertDialogDescription>
              Tin này sẽ bị gỡ khỏi hệ thống. Bạn vẫn có thể tạo lại một tin mới nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  void handleDelete(deleteTarget);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa tin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
