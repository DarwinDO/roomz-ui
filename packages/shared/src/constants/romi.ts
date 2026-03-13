export const ROMI_NAME = 'ROMI';

const ROMI_PHONE_VIEWS_PER_DAY = 100;

export const ROMI_WELCOME_MESSAGE =
  'Xin chào! Tôi là ROMI, trợ lý của RommZ. Tôi có thể giúp bạn tìm phòng, tìm dịch vụ, tìm ưu đãi và gợi ý bước tiếp theo phù hợp.';

export const ROMI_SUGGESTED_QUESTIONS = [
  'Tìm phòng ở Quận 7 dưới 3 triệu',
  'Tìm dịch vụ chuyển nhà ở Hà Nội',
  'Có deal cafe nào ở TP.HCM?',
] as const;

export const ROMI_APP_INFO_TOPICS = [
  'verification',
  'rommz_plus',
  'swap_room',
  'services',
  'perks',
  'roommate_matching',
  'general',
] as const;

export type RomiAppInfoTopic = typeof ROMI_APP_INFO_TOPICS[number];

export const ROMI_APP_INFO: Record<RomiAppInfoTopic, string> = {
  verification:
    'Xác thực tài khoản RommZ gồm xác thực email và xác thực giấy tờ tùy thân. Tài khoản đã xác thực sẽ tăng độ tin cậy khi tương tác trên nền tảng.',
  rommz_plus: `RommZ+ là gói premium 49.000đ/tháng:\n- Xem SĐT chủ nhà tới ${ROMI_PHONE_VIEWS_PER_DAY} lượt/ngày\n- Lưu phòng yêu thích không giới hạn\n- Xem hồ sơ và gửi lời chào roommate không giới hạn\n- Mở khóa deal Premium của Local Passport\n- Hiển thị badge RommZ+ trên hồ sơ`,
  swap_room:
    'SwapRoom hỗ trợ cho thuê lại ngắn hạn hoặc hoán đổi phòng trong các tình huống như thực tập, chuyển chỗ ở tạm thời hoặc đi học ngắn hạn.',
  services:
    'RommZ có hệ sinh thái dịch vụ đối tác như chuyển nhà, dọn dẹp, nội thất và điện nước. Nếu bạn muốn, ROMI có thể tìm dịch vụ theo khu vực ngay từ dữ liệu đối tác hiện có.',
  perks:
    'Local Passport tổng hợp deal và ưu đãi theo khu vực. Một số deal chỉ mở cho người dùng RommZ+. Nếu bạn nói khu vực hoặc loại ưu đãi muốn tìm, ROMI có thể tra ngay từ dữ liệu hiện có.',
  roommate_matching:
    'Tính năng tìm bạn cùng phòng dùng hồ sơ, khu vực và mức độ phù hợp để gợi ý người có thể sống chung tốt hơn. Bạn có thể xem hồ sơ và gửi lời chào trực tiếp.',
  general:
    'RommZ là nền tảng giúp sinh viên tìm phòng trọ, tìm bạn cùng phòng, dùng dịch vụ đối tác và nhận ưu đãi theo khu vực.',
};

export function getRomiAppInfo(topic: string | null | undefined): string {
  if (!topic) return ROMI_APP_INFO.general;
  return ROMI_APP_INFO[topic as RomiAppInfoTopic] || ROMI_APP_INFO.general;
}