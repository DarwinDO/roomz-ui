/**
 * Vietnam Provinces and Districts Data
 * Source: https://provinces.open-api.vn/api/
 * Last updated: 2026-01-29
 */

export interface District {
    code: number;
    name: string;
    provinceCode: number;
}

export interface Province {
    code: number;
    name: string;
    districts?: District[];
}

/**
 * 63 Provinces/Cities of Vietnam
 * Ordered by: Direct municipalities first, then alphabetically
 */
export const PROVINCES: Province[] = [
    { code: 1, name: "Hà Nội" },
    { code: 79, name: "Hồ Chí Minh" },
    { code: 48, name: "Đà Nẵng" },
    { code: 31, name: "Hải Phòng" },
    { code: 92, name: "Cần Thơ" },
    { code: 89, name: "An Giang" },
    { code: 77, name: "Bà Rịa - Vũng Tàu" },
    { code: 24, name: "Bắc Giang" },
    { code: 6, name: "Bắc Kạn" },
    { code: 95, name: "Bạc Liêu" },
    { code: 27, name: "Bắc Ninh" },
    { code: 83, name: "Bến Tre" },
    { code: 52, name: "Bình Định" },
    { code: 74, name: "Bình Dương" },
    { code: 70, name: "Bình Phước" },
    { code: 60, name: "Bình Thuận" },
    { code: 96, name: "Cà Mau" },
    { code: 4, name: "Cao Bằng" },
    { code: 66, name: "Đắk Lắk" },
    { code: 67, name: "Đắk Nông" },
    { code: 11, name: "Điện Biên" },
    { code: 75, name: "Đồng Nai" },
    { code: 87, name: "Đồng Tháp" },
    { code: 64, name: "Gia Lai" },
    { code: 2, name: "Hà Giang" },
    { code: 35, name: "Hà Nam" },
    { code: 42, name: "Hà Tĩnh" },
    { code: 30, name: "Hải Dương" },
    { code: 93, name: "Hậu Giang" },
    { code: 17, name: "Hòa Bình" },
    { code: 33, name: "Hưng Yên" },
    { code: 56, name: "Khánh Hòa" },
    { code: 91, name: "Kiên Giang" },
    { code: 62, name: "Kon Tum" },
    { code: 12, name: "Lai Châu" },
    { code: 68, name: "Lâm Đồng" },
    { code: 20, name: "Lạng Sơn" },
    { code: 10, name: "Lào Cai" },
    { code: 80, name: "Long An" },
    { code: 36, name: "Nam Định" },
    { code: 40, name: "Nghệ An" },
    { code: 37, name: "Ninh Bình" },
    { code: 58, name: "Ninh Thuận" },
    { code: 25, name: "Phú Thọ" },
    { code: 54, name: "Phú Yên" },
    { code: 44, name: "Quảng Bình" },
    { code: 49, name: "Quảng Nam" },
    { code: 51, name: "Quảng Ngãi" },
    { code: 22, name: "Quảng Ninh" },
    { code: 45, name: "Quảng Trị" },
    { code: 94, name: "Sóc Trăng" },
    { code: 14, name: "Sơn La" },
    { code: 72, name: "Tây Ninh" },
    { code: 34, name: "Thái Bình" },
    { code: 19, name: "Thái Nguyên" },
    { code: 38, name: "Thanh Hóa" },
    { code: 46, name: "Thừa Thiên Huế" },
    { code: 82, name: "Tiền Giang" },
    { code: 84, name: "Trà Vinh" },
    { code: 8, name: "Tuyên Quang" },
    { code: 86, name: "Vĩnh Long" },
    { code: 26, name: "Vĩnh Phúc" },
    { code: 15, name: "Yên Bái" },
];

/**
 * Fallback districts for major cities
 * Will be populated from API, this is just backup
 */
export const DISTRICTS_FALLBACK: Record<string, District[]> = {
    "Hà Nội": [
        { code: 1, name: "Ba Đình", provinceCode: 1 },
        { code: 2, name: "Hoàn Kiếm", provinceCode: 1 },
        { code: 3, name: "Tây Hồ", provinceCode: 1 },
        { code: 4, name: "Long Biên", provinceCode: 1 },
        { code: 5, name: "Cầu Giấy", provinceCode: 1 },
        { code: 6, name: "Đống Đa", provinceCode: 1 },
        { code: 7, name: "Hai Bà Trưng", provinceCode: 1 },
        { code: 8, name: "Hoàng Mai", provinceCode: 1 },
        { code: 9, name: "Thanh Xuân", provinceCode: 1 },
        { code: 16, name: "Sóc Sơn", provinceCode: 1 },
        { code: 17, name: "Đông Anh", provinceCode: 1 },
        { code: 18, name: "Gia Lâm", provinceCode: 1 },
        { code: 19, name: "Nam Từ Liêm", provinceCode: 1 },
        { code: 20, name: "Thanh Trì", provinceCode: 1 },
        { code: 21, name: "Bắc Từ Liêm", provinceCode: 1 },
        { code: 250, name: "Mê Linh", provinceCode: 1 },
        { code: 268, name: "Hà Đông", provinceCode: 1 },
        { code: 269, name: "Sơn Tây", provinceCode: 1 },
        { code: 271, name: "Ba Vì", provinceCode: 1 },
        { code: 272, name: "Phúc Thọ", provinceCode: 1 },
        { code: 273, name: "Đan Phượng", provinceCode: 1 },
        { code: 274, name: "Hoài Đức", provinceCode: 1 },
        { code: 275, name: "Quốc Oai", provinceCode: 1 },
        { code: 276, name: "Thạch Thất", provinceCode: 1 },
        { code: 277, name: "Chương Mỹ", provinceCode: 1 },
        { code: 278, name: "Thanh Oai", provinceCode: 1 },
        { code: 279, name: "Thường Tín", provinceCode: 1 },
        { code: 280, name: "Phú Xuyên", provinceCode: 1 },
        { code: 281, name: "Ứng Hòa", provinceCode: 1 },
        { code: 282, name: "Mỹ Đức", provinceCode: 1 },
    ],
    "Hồ Chí Minh": [
        { code: 760, name: "Quận 1", provinceCode: 79 },
        { code: 761, name: "Quận 12", provinceCode: 79 },
        { code: 764, name: "Quận Gò Vấp", provinceCode: 79 },
        { code: 765, name: "Quận Bình Thạnh", provinceCode: 79 },
        { code: 766, name: "Quận Tân Bình", provinceCode: 79 },
        { code: 767, name: "Quận Tân Phú", provinceCode: 79 },
        { code: 768, name: "Quận Phú Nhuận", provinceCode: 79 },
        { code: 769, name: "Thành phố Thủ Đức", provinceCode: 79 },
        { code: 770, name: "Quận 3", provinceCode: 79 },
        { code: 771, name: "Quận 10", provinceCode: 79 },
        { code: 772, name: "Quận 11", provinceCode: 79 },
        { code: 773, name: "Quận 4", provinceCode: 79 },
        { code: 774, name: "Quận 5", provinceCode: 79 },
        { code: 775, name: "Quận 6", provinceCode: 79 },
        { code: 776, name: "Quận 8", provinceCode: 79 },
        { code: 777, name: "Quận Bình Tân", provinceCode: 79 },
        { code: 778, name: "Quận 7", provinceCode: 79 },
        { code: 783, name: "Huyện Củ Chi", provinceCode: 79 },
        { code: 784, name: "Huyện Hóc Môn", provinceCode: 79 },
        { code: 785, name: "Huyện Bình Chánh", provinceCode: 79 },
        { code: 786, name: "Huyện Nhà Bè", provinceCode: 79 },
        { code: 787, name: "Huyện Cần Giờ", provinceCode: 79 },
    ],
    "Đà Nẵng": [
        { code: 490, name: "Quận Liên Chiểu", provinceCode: 48 },
        { code: 491, name: "Quận Thanh Khê", provinceCode: 48 },
        { code: 492, name: "Quận Hải Châu", provinceCode: 48 },
        { code: 493, name: "Quận Sơn Trà", provinceCode: 48 },
        { code: 494, name: "Quận Ngũ Hành Sơn", provinceCode: 48 },
        { code: 495, name: "Quận Cẩm Lệ", provinceCode: 48 },
        { code: 497, name: "Huyện Hòa Vang", provinceCode: 48 },
        { code: 498, name: "Huyện Hoàng Sa", provinceCode: 48 },
    ],
};
