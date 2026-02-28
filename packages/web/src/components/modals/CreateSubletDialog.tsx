import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Home, Plus } from "lucide-react";

interface CreateSubletDialogProps {
    children?: React.ReactNode;
}

export function CreateSubletDialog({ children }: CreateSubletDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-primary hover:bg-primary/90 rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Đăng phòng của bạn
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl sm:max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Đăng phòng cho thuê ngắn hạn</DialogTitle>
                    <DialogDescription>
                        Điền thông tin chi tiết để đăng tin sublet trong thời gian ngắn.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Tiêu đề phòng</Label>
                        <Input
                            id="title"
                            placeholder="Ví dụ: Căn studio ấm cúng gần trường"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Ngày bắt đầu</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="start-date"
                                    type="date"
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Ngày kết thúc</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="end-date"
                                    type="date"
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Giá theo tháng (VND)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="price"
                                type="number"
                                placeholder="3500000"
                                className="pl-10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả chi tiết</Label>
                        <Textarea
                            id="description"
                            placeholder="Mô tả phòng, tiện nghi và lý do đây là lựa chọn lý tưởng..."
                            className="rounded-xl min-h-32"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Loại phòng</Label>
                        <div className="flex flex-wrap gap-2">
                            {["Phòng riêng", "Phòng chung", "Căn studio", "Nguyên căn"].map((type) => (
                                <Badge
                                    key={type}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors rounded-lg py-1 px-3"
                                >
                                    {type}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl h-11">
                        <Home className="w-4 h-4 mr-2" />
                        Đăng tin
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
