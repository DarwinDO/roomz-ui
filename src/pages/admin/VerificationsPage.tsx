import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { ShieldCheck, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { mockVerifications, type VerificationRequest } from "@/data/adminData";
import { toast } from "sonner";

export default function VerificationsPage() {
  const [tab, setTab] = useState("pending");
  const [verifications, setVerifications] = useState(mockVerifications);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);

  const filteredVerifications = verifications.filter(v => v.status === tab);

  const handleApprove = (id: string) => {
    setVerifications(verifications.map(v => 
      v.id === id ? { ...v, status: "approved" } : v
    ));
    setSelectedVerification(null);
    toast.success("Đã phê duyệt yêu cầu xác thực");
  };

  const handleReject = (id: string) => {
    setVerifications(verifications.map(v => 
      v.id === id ? { ...v, status: "rejected", reason: "Giấy tờ không rõ ràng" } : v
    ));
    setSelectedVerification(null);
    toast.success("Đã từ chối yêu cầu xác thực");
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case "id": return "CMND/CCCD";
      case "student_id": return "Thẻ sinh viên";
      case "landlord": return "Chủ nhà";
      default: return type;
    }
  };

  const columns = [
    {
      key: "user",
      label: "Người dùng",
      render: (item: VerificationRequest) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {item.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{item.userName}</div>
            <div className="text-sm text-gray-500">{item.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Loại xác thực",
      render: (item: VerificationRequest) => (
        <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
      ),
    },
    {
      key: "submittedDate",
      label: "Ngày gửi",
      render: (item: VerificationRequest) => (
        <span className="text-gray-600 text-sm">
          {new Date(item.submittedDate).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: VerificationRequest) => (
        <Badge 
          className={
            item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            item.status === "approved" ? "bg-green-100 text-green-700" :
            "bg-red-100 text-red-700"
          }
        >
          {item.status === "pending" ? "Chờ duyệt" : 
           item.status === "approved" ? "Đã duyệt" : "Từ chối"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (item: VerificationRequest) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setSelectedVerification(item)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Xem
          </Button>
          {item.status === "pending" && (
            <>
              <Button 
                size="sm"
                onClick={() => handleApprove(item.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Duyệt
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => handleReject(item.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Từ chối
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Yêu cầu xác thực</h1>
        <p className="text-gray-600 mt-1">Quản lý các yêu cầu xác thực từ người dùng</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Chờ duyệt ({verifications.filter(v => v.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="w-4 h-4 mr-2" />
            Đã duyệt ({verifications.filter(v => v.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="w-4 h-4 mr-2" />
            Từ chối ({verifications.filter(v => v.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <DataTable
            data={filteredVerifications}
            columns={columns}
            searchPlaceholder="Tìm theo tên hoặc email..."
            pageSize={15}
          />
        </TabsContent>
      </Tabs>

      {/* Document Viewer Modal */}
      {selectedVerification && (
        <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Chi tiết xác thực - {selectedVerification.userName}</DialogTitle>
              <DialogDescription>
                Loại: {getTypeLabel(selectedVerification.type)} | 
                Ngày gửi: {new Date(selectedVerification.submittedDate).toLocaleDateString('vi-VN')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedVerification.documents.map((doc, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={doc}
                      alt={`Document ${idx + 1}`}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                ))}
              </div>

              {selectedVerification.status === "rejected" && selectedVerification.reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Lý do từ chối:</strong> {selectedVerification.reason}
                  </p>
                </div>
              )}

              {selectedVerification.status === "pending" && (
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="destructive"
                    onClick={() => handleReject(selectedVerification.id)}
                  >
                    Từ chối
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedVerification.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Phê duyệt
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


