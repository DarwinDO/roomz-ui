# Outcome 1 - Tài liệu MVP Nộp Đánh Giá

> Cập nhật lần cuối: 14/04/2026

## Phạm vi tài liệu

Tài liệu này là bản ngắn dùng để nộp cho `Outcome 1 / mục 3`. Nội dung chỉ tập trung vào ba phần bắt buộc:

- nhóm người dùng mục tiêu
- giá trị cốt lõi của sản phẩm
- các chỉ số dự kiến đo ở giai đoạn MVP

Ở thời điểm hiện tại, phạm vi phù hợp nhất để trình bày với người chấm là `MVP bản web`. Đây là phần đã có luồng người dùng đủ rõ để demo end-to-end, nên Outcome 1 nên được định vị là `web-first MVP`, không mở rộng thành tuyên bố mobile-parity hay full-platform.

## 1. Sản phẩm và phạm vi MVP

`RommZ` là nền tảng hỗ trợ sinh viên và người thuê trẻ tại Việt Nam tìm phòng rõ hơn và ra quyết định nhanh hơn. Sản phẩm không chỉ dừng ở việc hiển thị tin đăng, mà hỗ trợ một hành trình thực tế: bắt đầu từ tìm kiếm, đi qua xem chi tiết phòng, chuyển sang liên hệ hoặc nhắn tin, rồi mở rộng sang tìm bạn ở ghép, trợ lý ROMI, dịch vụ, ưu đãi và RommZ+ khi cần.

Vì vậy, RommZ nên được mô tả là một `nền tảng hỗ trợ ra quyết định thuê trọ`, không chỉ là nơi đăng và xem tin phòng trọ.

Trong MVP web hiện tại, các luồng cốt lõi đã có gồm: `/search`, `/room/:id`, `/messages`, `/roommates`, `/services`, `/community`, `/romi` và `/payment`. Đây là đủ cơ sở để trình bày một user flow hoàn chỉnh trong bài demo.

## 2. Nhóm người dùng mục tiêu

Nhóm phù hợp nhất với RommZ hiện tại là:

> `Sinh viên và người thuê trẻ ở đô thị, đang có nhu cầu tìm phòng trong thời gian ngắn, muốn rút ngắn thời gian tìm kiếm nhưng vẫn cần độ rõ ràng và độ tin cậy trước khi liên hệ.`

Nhóm này thường nhạy cảm về giá, có áp lực phải chốt chỗ ở sớm, hay tìm theo trường, quận hoặc trục di chuyển, và dễ mệt khi phải lướt quá nhiều tin nhưng vẫn không biết tin nào đáng liên hệ.

Persona tiêu biểu là `Minh`, 20 tuổi, chuẩn bị chuyển trọ cho học kỳ mới. Minh có ngân sách giới hạn, cần phòng gần trường, và muốn nhanh chóng rút gọn xuống vài lựa chọn thực sự phù hợp. Minh chỉ muốn liên hệ khi đã có đủ cơ sở để tin rằng listing đó đáng quan tâm. Nếu cần, Minh cũng muốn có thể tìm bạn ở ghép phù hợp hoặc được dẫn sang các dịch vụ liên quan đến việc chuyển ở.

Nhóm này phù hợp với MVP hiện tại vì RommZ đã có đủ các lớp sản phẩm quan trọng cho nhu cầu của họ: tìm kiếm, chi tiết phòng, nhắn tin, tìm bạn ở ghép, dịch vụ, ưu đãi, ROMI và RommZ+.

## 3. Giá trị cốt lõi

Giá trị cốt lõi phù hợp nhất với MVP hiện tại là:

> `RommZ giúp sinh viên và người thuê trẻ tìm phòng rõ hơn và chốt quyết định nhanh hơn.`

Thông điệp ngắn gọn nên dùng nhất quán là:

> `Tìm phòng rõ hơn, chốt nhanh hơn.`

`Tìm phòng rõ hơn` đến từ việc sản phẩm lấy tìm kiếm làm điểm bắt đầu chính, dùng trang chi tiết phòng để giúp người dùng đánh giá listing tốt hơn, và bám vào nhu cầu thuê trọ thật thay vì chỉ cho xem nhiều tin. `Chốt nhanh hơn` đến từ luồng liên hệ, nhắn tin, tìm bạn ở ghép, các bước hỗ trợ tiếp theo như dịch vụ và ưu đãi, cùng với ROMI để người dùng mới không bị kẹt ở bước khám phá ban đầu.

Khác với một nền tảng đăng tin phòng trọ thông thường, RommZ kết nối tìm phòng, xem chi tiết phòng, liên hệ, nhắn tin, tìm bạn ở ghép, dịch vụ, ưu đãi, RommZ+ và ROMI trong cùng một hành trình ra quyết định thuê trọ. Đây là khác biệt cốt lõi của MVP hiện tại.

## 4. Các chỉ số dự kiến đo

Chỉ số sao Bắc Cực phù hợp nhất cho MVP hiện tại là:

> `Số hành động quyết định thuê trọ đạt chất lượng mỗi tuần`

Đây là số người dùng duy nhất trong tuần thực hiện ít nhất một hành động có mức quan tâm cao như: liên hệ chủ nhà, bắt đầu hoặc gửi tin nhắn, lưu phòng, gửi yêu cầu tìm bạn ở ghép, bắt đầu yêu cầu dịch vụ sau khi đã có bối cảnh thuê trọ, hoặc bắt đầu nâng cấp RommZ+ từ một điểm chạm có ý định rõ ràng.

Năm chỉ số quan trọng nhất để theo dõi là:

1. `Tỷ lệ kích hoạt tìm kiếm`: tỷ lệ người truy cập bắt đầu một phiên tìm kiếm có ý nghĩa.
2. `Tỷ lệ chuyển từ tìm kiếm sang chi tiết phòng`: tỷ lệ phiên tìm kiếm mở ít nhất một chi tiết phòng.
3. `Tỷ lệ chuyển từ chi tiết phòng sang liên hệ hoặc nhắn tin`: tỷ lệ người xem chi tiết phòng chuyển sang hành động thật.
4. `Tỷ lệ nhấp vào hành động do ROMI gợi ý`: tỷ lệ phiên ROMI dẫn tới hành động tiếp theo trong sản phẩm.
5. `Tỷ lệ quay lại sau 7 ngày`: tỷ lệ người dùng mới quay lại trong vòng 7 ngày.

Bộ chỉ số này đủ để đánh giá chất lượng MVP theo chuỗi: người dùng có bắt đầu hành động hay không, kết quả tìm kiếm có đủ liên quan hay không, listing có đủ rõ để tạo ra liên hệ thật hay không, ROMI có giúp người dùng đi đúng hướng hay không, và sản phẩm có giữ được người dùng quay lại hay không.

## 5. Cách trình bày cho đúng với trạng thái hiện tại

Để tài liệu này đúng với tinh thần MVP và tránh khẳng định quá mức, nhóm nên nói rõ:

- đây là `MVP bản web`, không phải tuyên bố mobile đã hoàn thiện
- đây là `các chỉ số dự kiến đo`, không phải kết quả kinh doanh đã được chứng minh
- ROMI là `trợ lý dẫn luồng sản phẩm`, không phải chatbot tổng quát
- RommZ+ đã có hệ thống thanh toán và các quyền lợi cốt lõi đang hoạt động, như xem số điện thoại host theo hạn mức, lưu phòng, mở rộng giới hạn roommate và mở khóa deal premium; một số quyền lợi nâng cao vẫn đang trong kế hoạch nên không nên quảng bá như tính năng đã hoàn thiện

## 6. Kết luận

Ở trạng thái hiện tại, RommZ có thể được trình bày một cách chắc chắn như một MVP bản web dành cho sinh viên và người thuê trẻ, với giá trị cốt lõi là `tìm phòng rõ hơn, chốt nhanh hơn`. MVP này đã có nhóm người dùng mục tiêu rõ, thông điệp giá trị rõ, phạm vi sản phẩm đủ để demo, và khung chỉ số đủ để đo lường chất lượng trong giai đoạn đầu. Đây là nền tảng phù hợp để nộp `Outcome 1 / mục 3` một cách thực tế và thuyết phục.
