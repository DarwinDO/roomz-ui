import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Wifi,
    ParkingCircle,
    WashingMachine,
    AirVent,
    Loader2,
    CheckCircle,
    ImagePlus,
    Camera,
    X,
} from "lucide-react";
import type { PostRoomFormData } from "../types";

interface StepAmenitiesImagesProps {
    formData: PostRoomFormData;
    handleInputChange: (field: string, value: string | boolean) => void;
    handleSubmit: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    isUploading: boolean;
    uploadProgress: number;
    previewUrls: string[];
    selectedFiles: File[];
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (e: React.DragEvent) => void;
    removeImage: (index: number) => void;
    fileInputRef: React.RefObject<any>;
}

export function StepAmenitiesImages({
    formData,
    handleInputChange,
    handleSubmit,
    onBack,
    isSubmitting,
    isUploading,
    uploadProgress,
    previewUrls,
    selectedFiles,
    handleFileSelect,
    handleDrop,
    removeImage,
    fileInputRef,
}: StepAmenitiesImagesProps) {
    return (
        <Card className="shadow-soft animate-fade-in border border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ImagePlus className="w-5 h-5 text-primary" />
                    </div>
                    Tiện nghi & Hình ảnh
                </CardTitle>
                <CardDescription>Thêm tiện nghi và ảnh phòng để tăng độ hấp dẫn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Amenities */}
                <div>
                    <Label className="mb-4 block text-base font-medium">Tiện nghi có sẵn</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: "wifi", icon: Wifi, label: "WiFi tốc độ cao" },
                            { key: "airConditioning", icon: AirVent, label: "Điều hòa nhiệt độ" },
                            { key: "parking", icon: ParkingCircle, label: "Chỗ đỗ xe rộng rãi" },
                            { key: "washingMachine", icon: WashingMachine, label: "Máy giặt chung/riêng" },
                        ].map(({ key, icon: Icon, label }) => (
                            <div
                                key={key}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${formData[key as keyof PostRoomFormData]
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                                    }`}
                                onClick={() =>
                                    handleInputChange(key, !formData[key as keyof PostRoomFormData])
                                }
                            >
                                <div className={`p-2 rounded-full ${formData[key as keyof PostRoomFormData] ? "bg-primary/10" : "bg-muted"}`}>
                                    <Icon
                                        className={`w-5 h-5 ${formData[key as keyof PostRoomFormData]
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                            }`}
                                    />
                                </div>
                                <span className={`text-sm font-medium ${formData[key as keyof PostRoomFormData] ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images Upload */}
                <div>
                    <Label className="mb-3 block text-base font-medium">Hình ảnh phòng thực tế</Label>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${isUploading
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                            }`}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${isUploading ? "bg-primary/10" : "bg-muted"}`}>
                            {isUploading ? (
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            ) : (
                                <Camera className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                            {isUploading ? "Đang tải lên..." : "Tải ảnh lên"}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                            Kéo thả hình ảnh vào đây hoặc nhấp để chọn từ máy tính
                        </p>
                        <div className="text-xs text-muted-foreground bg-background/50 inline-block px-3 py-1 rounded-full border border-border">
                            Hỗ trợ: PNG, JPG • Tối đa 5MB/ảnh
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="mt-4 space-y-2 animate-fade-in">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tiến độ tải lên</span>
                                <span className="font-medium text-primary">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}

                    {/* Preview Grid */}
                    {previewUrls.length > 0 && (
                        <div className="mt-6 space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Đã chọn {selectedFiles.length} ảnh
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || isSubmitting}
                                    className="h-8 rounded-lg"
                                >
                                    <ImagePlus className="w-4 h-4 mr-2" />
                                    Thêm ảnh
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative group aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {!isUploading && !isSubmitting && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(index);
                                                }}
                                                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        {index === 0 && (
                                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded-md">
                                                Ảnh bìa
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {previewUrls.length === 0 && !isUploading && (
                        <p className="text-sm text-muted-foreground mt-4 text-center italic">
                            Khuyên dùng: Thêm ít nhất 3 ảnh rõ nét để tăng 50% cơ hội cho thuê
                        </p>
                    )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                    <Button variant="outline" onClick={onBack} className="flex-1 rounded-xl h-12" disabled={isSubmitting}>
                        Quay lại
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploading}
                        className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Đăng phòng ngay
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
