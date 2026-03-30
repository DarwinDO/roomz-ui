export interface RomiKnowledgeDocumentSeed {
  slug: string;
  title: string;
  section:
    | 'onboarding'
    | 'pricing'
    | 'eligibility'
    | 'premium'
    | 'verification'
    | 'roommates'
    | 'services'
    | 'local_passport'
    | 'short_stay';
  audience: 'guest' | 'user' | 'both';
  summary: string;
  chunks: string[];
}

export const ROMI_KNOWLEDGE_DOCUMENTS: RomiKnowledgeDocumentSeed[] = [
  {
    slug: 'rommz-onboarding',
    title: 'Bắt đầu với RommZ',
    section: 'onboarding',
    audience: 'both',
    summary: 'Giải thích RommZ là gì, người mới nên bắt đầu từ đâu và lúc nào cần đăng nhập.',
    chunks: [
      'RommZ là nền tảng hỗ trợ sinh viên tìm phòng, tìm bạn cùng phòng, tìm chỗ ở ngắn hạn, dùng dịch vụ đối tác và nhận ưu đãi theo khu vực. ROMI đóng vai trò concierge để gom nhu cầu, làm rõ bối cảnh và chỉ sang đúng flow tiếp theo.',
      'Người mới nên bắt đầu bằng cách nói rõ khu vực, ngân sách, loại phòng hoặc quyền lợi đang cần. Nếu chưa rõ nhu cầu, ROMI sẽ hỏi bù theo kiểu discover để chốt tiêu chí trước khi tìm phòng, deal hoặc dịch vụ.',
      'Guest có thể khám phá hướng dẫn sản phẩm, tìm phòng công khai, xem deal công khai và đọc quyền lợi cơ bản. Đăng nhập cần thiết khi người dùng muốn lưu lịch sử, nhận gợi ý cá nhân hóa, liên hệ sâu hơn hoặc đi vào flow có entitlement.',
    ],
  },
  {
    slug: 'rommz-plus-pricing',
    title: 'RommZ+ pricing và entitlement',
    section: 'pricing',
    audience: 'both',
    summary: 'Chi tiết giá và quyền lợi chính của RommZ+.',
    chunks: [
      'RommZ+ là gói premium 39.000đ mỗi tháng. Gói này tập trung vào việc tăng tốc quyết định thuê phòng và mở thêm quyền lợi khi người dùng cần hành động sâu hơn trong hệ sinh thái.',
      'Quyền lợi chính của RommZ+ gồm xem số điện thoại host tới 100 lượt mỗi ngày, lưu phòng yêu thích không giới hạn, xem hồ sơ và gửi lời chào roommate không giới hạn, mở khóa deal Premium của Local Passport và hiển thị badge RommZ+ trên hồ sơ.',
      'Khi người dùng hỏi có nên nâng cấp hay không, ROMI nên giải thích theo use case: nếu chỉ đang khám phá thông tin thì chưa cần; nếu cần liên hệ nhiều host, dùng roommate thường xuyên hoặc muốn mở deal Premium thì RommZ+ có giá trị rõ ràng hơn.',
    ],
  },
  {
    slug: 'rommz-verification',
    title: 'Xác thực tài khoản RommZ',
    section: 'verification',
    audience: 'both',
    summary: 'Luồng xác thực và tác động tới độ tin cậy trên nền tảng.',
    chunks: [
      'Xác thực tài khoản RommZ gồm xác thực email và xác thực giấy tờ tùy thân. Mục tiêu là tăng độ tin cậy khi người dùng tương tác, thuê phòng hoặc tham gia các flow cộng đồng.',
      'Khi người dùng hỏi vì sao nên xác thực, ROMI cần nhấn mạnh rằng tài khoản đã xác thực tăng độ tin cậy của hồ sơ và giúp quá trình tương tác trên nền tảng an tâm hơn. Nếu người dùng chưa đăng nhập, ROMI nên handoff sang đăng nhập trước khi chỉ tiếp flow xác thực.',
    ],
  },
  {
    slug: 'rommz-local-passport',
    title: 'Local Passport và deal theo khu vực',
    section: 'local_passport',
    audience: 'both',
    summary: 'Mô tả deal, ưu đãi theo khu vực và cách RommZ+ liên quan tới deal Premium.',
    chunks: [
      'Local Passport tổng hợp deal và ưu đãi theo khu vực để người dùng mới chuyển chỗ ở có thể tiếp cận dịch vụ hoặc tiện ích xung quanh nhanh hơn. Người dùng nên nói rõ khu vực hoặc loại deal muốn tìm để ROMI lọc đúng hơn.',
      'Một số deal được đánh dấu Premium. Các deal này chỉ mở khóa cho người dùng RommZ+. Nếu người dùng đang ở guest mode hoặc chưa có entitlement, ROMI nên nói rõ phần nào công khai được xem và phần nào cần đăng nhập hoặc nâng cấp.',
    ],
  },
  {
    slug: 'rommz-services',
    title: 'Dịch vụ đối tác',
    section: 'services',
    audience: 'both',
    summary: 'Giải thích nhóm dịch vụ đối tác và cách dùng ROMI để tiếp cận.',
    chunks: [
      'RommZ có hệ sinh thái dịch vụ đối tác như chuyển nhà, dọn dẹp, nội thất và điện nước. Các câu hỏi về dịch vụ nên được gắn với khu vực, loại nhu cầu và mức khẩn cấp để ROMI tìm đúng đối tác hơn.',
      'Nếu người dùng chỉ mới khám phá, ROMI nên gợi ý category và khu vực thay vì đưa ra câu trả lời chung chung. Nếu người dùng đã xác định rõ nhu cầu, ROMI có thể kết hợp dữ liệu dịch vụ đang mở với context từ journey state để tạo câu trả lời sát thực tế hơn.',
    ],
  },
  {
    slug: 'rommz-roommate-matching',
    title: 'Roommate matching',
    section: 'roommates',
    audience: 'both',
    summary: 'Cách tính năng roommate hoạt động và khi nào cần đăng nhập.',
    chunks: [
      'Tính năng tìm bạn cùng phòng dùng hồ sơ, khu vực và mức độ phù hợp để gợi ý người có thể sống chung tốt hơn. Đây là flow mang tính cá nhân hóa nên ROMI cần giải thích rằng đăng nhập là bước cần thiết nếu người dùng muốn xem hồ sơ hoặc gửi lời chào.',
      'Khi người dùng hỏi chung về roommate, ROMI nên trả lời ở mức sản phẩm: có thể tạo hồ sơ, xem đề xuất phù hợp và chủ động kết nối. Khi người dùng muốn bắt đầu thật sự, ROMI nên handoff sang route roommate và kèm lý do vì sao cần đăng nhập.',
    ],
  },
  {
    slug: 'rommz-short-stay',
    title: 'Ở ngắn hạn và swap room',
    section: 'short_stay',
    audience: 'both',
    summary: 'Giải thích use case ở ngắn hạn hoặc hoán đổi chỗ ở.',
    chunks: [
      'Ở ngắn hạn hỗ trợ cho thuê lại ngắn hạn hoặc hoán đổi chỗ ở trong các tình huống như thực tập, chuyển chỗ ở tạm thời hoặc đi học ngắn hạn. Người dùng nên mô tả mốc thời gian, khu vực và mục tiêu chuyển chỗ để ROMI hướng đúng flow.',
      'Khi người dùng mới chỉ đang hỏi khả năng, ROMI nên giải thích ngắn gọn mục đích của tính năng. Khi người dùng muốn đăng listing, xem match hoặc thực hiện trao đổi thật, ROMI nên handoff sang route swap và yêu cầu đăng nhập nếu cần.',
    ],
  },
];
