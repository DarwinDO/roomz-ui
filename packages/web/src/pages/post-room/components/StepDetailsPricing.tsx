import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Ruler, Bed, Bath, Users, Calendar } from "lucide-react";
import type { PostRoomFormData } from "../types";

interface StepDetailsPricingProps {
    formData: PostRoomFormData;
    handleInputChange: (field: string, value: string | boolean) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepDetailsPricing({ formData, handleInputChange, onNext, onBack }: StepDetailsPricingProps) {
    return (
        <Card className="shadow-soft animate-fade-in border border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    Chi tiết & Giá cả
                </CardTitle>
                <CardDescription>Thông tin chi tiết về phòng và mức giá cho thuê</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="pricePerMonth" className="text-base font-medium">Giá thuê/tháng (VNĐ) <span className="text-destructive">*</span></Label>
                        <div className="relative mt-2">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <CurrencyInput
                                id="pricePerMonth"
                                value={formData.pricePerMonth}
                                onValueChange={(value) => handleInputChange("pricePerMonth", value)}
                                placeholder="3.000.000"
                                className="pl-10 rounded-xl h-11"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="depositAmount" className="text-base font-medium">Tiền cọc (VNĐ)</Label>
                        <CurrencyInput
                            id="depositAmount"
                            value={formData.depositAmount}
                            onValueChange={(value) => handleInputChange("depositAmount", value)}
                            placeholder="3.000.000"
                            className="mt-2 rounded-xl h-11"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="areaSqm" className="text-sm font-medium">Diện tích (m²)</Label>
                        <div className="relative mt-2">
                            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="areaSqm"
                                type="number"
                                value={formData.areaSqm}
                                onChange={(e) => handleInputChange("areaSqm", e.target.value)}
                                placeholder="25"
                                className="pl-10 rounded-xl"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="bedroomCount" className="text-sm font-medium">Phòng ngủ</Label>
                        <div className="relative mt-2">
                            <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="bedroomCount"
                                type="number"
                                value={formData.bedroomCount}
                                onChange={(e) => handleInputChange("bedroomCount", e.target.value)}
                                min="1"
                                className="pl-10 rounded-xl"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="bathroomCount" className="text-sm font-medium">Phòng tắm</Label>
                        <div className="relative mt-2">
                            <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="bathroomCount"
                                type="number"
                                value={formData.bathroomCount}
                                onChange={(e) => handleInputChange("bathroomCount", e.target.value)}
                                min="1"
                                className="pl-10 rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="maxOccupants" className="text-base font-medium">Số người tối đa</Label>
                        <div className="relative mt-2">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="maxOccupants"
                                type="number"
                                value={formData.maxOccupants}
                                onChange={(e) => handleInputChange("maxOccupants", e.target.value)}
                                min="1"
                                className="pl-10 rounded-xl h-11"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="minLeaseTerm" className="text-base font-medium">Thuê tối thiểu (tháng)</Label>
                        <div className="relative mt-2">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="minLeaseTerm"
                                type="number"
                                value={formData.minLeaseTerm}
                                onChange={(e) => handleInputChange("minLeaseTerm", e.target.value)}
                                min="1"
                                className="pl-10 rounded-xl h-11"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <Label htmlFor="availableFrom" className="text-base font-medium">Ngày có thể vào ở</Label>
                    <Input
                        id="availableFrom"
                        type="date"
                        value={formData.availableFrom}
                        onChange={(e) => handleInputChange("availableFrom", e.target.value)}
                        className="mt-2 rounded-xl h-11"
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                    <div>
                        <p className="font-medium text-base">Có nội thất</p>
                        <p className="text-sm text-muted-foreground">Phòng được trang bị nội thất cơ bản</p>
                    </div>
                    <Switch
                        checked={formData.furnished}
                        onCheckedChange={(v) => handleInputChange("furnished", v)}
                    />
                </div>

                <div className="flex gap-4 pt-2">
                    <Button variant="outline" onClick={onBack} className="flex-1 rounded-xl h-11">
                        Quay lại
                    </Button>
                    <Button onClick={onNext} className="flex-1 rounded-xl h-11">
                        Tiếp tục
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
