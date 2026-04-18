# Outcome 1 - MVP Product Brief Của RommZ

## Mục đích tài liệu

Tài liệu này là artifact phục vụ trực tiếp cho `Outcome 1 / mục 3`: trình bày rõ `persona / ICP`, `core value proposition`, và `core metrics dự kiến đo`.

Điểm quan trọng là tài liệu này được viết dựa trên `phạm vi MVP hiện có của RommZ trong repo`, không dựa trên roadmap tương lai. Vì vậy, phạm vi chính thức nên dùng để nộp và demo ở thời điểm hiện tại là:

- `web MVP` là bản chuẩn để deploy và quay demo
- `video demo` nên bám theo user flow của web
- `product brief` này mô tả đúng sản phẩm hiện có, không overclaim các phần chưa hoàn thiện

Lý do phải chốt như vậy: repo hiện có cả `packages/web`, `packages/mobile`, `packages/shared`, nhưng trạng thái dự án vẫn ghi rõ `mobile mapping` còn là phần việc chưa chốt. Nếu muốn trả lời người chấm một cách chắc chắn và thực tế, nhóm nên định vị Outcome 1 là `web-first MVP`.

## 1. Tóm tắt điều hành

`RommZ` là nền tảng hỗ trợ tìm phòng và ra quyết định thuê trọ dành cho sinh viên và người thuê trẻ tại Việt Nam. Sản phẩm không chỉ dừng ở việc hiển thị tin đăng, mà tập trung vào việc giúp người dùng:

- tìm được lựa chọn phù hợp nhanh hơn
- hiểu rõ listing hơn trước khi liên hệ
- chuyển từ “xem thử” sang “hành động thật” nhanh hơn
- có thêm các lớp hỗ trợ xung quanh quyết định thuê trọ như roommate, dịch vụ, ưu đãi, premium, và ROMI

Luận điểm giá trị cốt lõi ngắn gọn và phù hợp nhất với MVP hiện tại là:

> `Tìm phòng rõ hơn, chốt nhanh hơn.`

Đây là câu mô tả tốt nhất cho bản MVP hiện nay vì nó:

- bám sát chức năng hiện có
- nói bằng ngôn ngữ lợi ích người dùng
- đủ rộng để bao trùm search, detail, messaging, roommate, ROMI, services, premium
- không hứa vượt quá thứ mà sản phẩm đang làm được

## 2. Phạm vi nộp Outcome 1

## 2.1 MVP này là gì

Ở góc nhìn nộp bài và chấm MVP, RommZ nên được trình bày là:

> `Một web-first MVP giúp sinh viên và người thuê trẻ tìm phòng rõ hơn, đánh giá nhanh hơn, và chốt quyết định nhanh hơn trong cùng một hành trình sản phẩm.`

Nghĩa là MVP không chỉ là “có trang landing và có trang search”, mà là một chuỗi hành động đã đủ để mô tả một bài toán thực:

1. vào nền tảng
2. tìm phòng
3. xem chi tiết
4. liên hệ / nhắn tin
5. nếu cần, tiếp tục qua roommate, ROMI, services, deal, premium

## 2.2 MVP này không nên claim gì

Để tài liệu có độ tin cậy khi người chấm hỏi kỹ, nhóm không nên claim các ý sau như thể đã hoàn thiện:

- không nói mobile parity đã hoàn tất
- không nói RommZ đã là marketplace lớn hoặc đã có traction mạnh
- không nói toàn bộ benefit premium đều đã mature nếu có phần mới ở mức planned
- không nói ROMI là chatbot tổng quát; nên nói nó là lớp trợ lý hướng người dùng vào đúng flow sản phẩm

Nói ngắn gọn: nên trình bày RommZ như một `MVP có định vị rõ, luồng rõ, và measurement framework rõ`, chứ không nên trình bày như một sản phẩm đã fully scaled.

## 3. Bối cảnh bài toán

Người đi thuê phòng, đặc biệt là sinh viên hoặc người mới chuyển khu vực, thường gặp các vấn đề sau:

- nguồn tin phân mảnh, nhiều listing không rõ ràng
- khó đánh giá đâu là phòng đáng liên hệ
- phải tốn nhiều thời gian so sánh
- liên hệ chủ nhà nhưng không chắc đúng nhu cầu
- nhu cầu thực tế không chỉ là “một căn phòng”, mà còn là:
  bạn ở cùng phù hợp, dịch vụ hỗ trợ, ưu đãi xung quanh chỗ ở, và hướng dẫn nên bắt đầu từ đâu

Phần lớn các nền tảng đăng tin chỉ giải quyết được lớp đầu tiên: `có nhiều tin`. Nhưng với người thuê thật, nhu cầu quan trọng hơn là:

- tìm đúng hơn
- hiểu rõ hơn
- ra quyết định nhanh hơn

Đó là lý do RommZ cần được định vị không phải như một trang classifieds đơn thuần, mà như một `housing decision platform` ở mức MVP.

## 4. Persona Và ICP

## 4.1 Primary ICP

### Phát biểu ICP chính

ICP phù hợp nhất với RommZ ở thời điểm hiện tại là:

> `Sinh viên và người thuê trẻ ở đô thị, đang có nhu cầu tìm phòng trong thời gian gần, muốn rút ngắn thời gian tìm kiếm nhưng vẫn cần độ rõ ràng và độ tin cậy trước khi liên hệ.`

### Đặc điểm chính của ICP này

- độ tuổi thường từ cuối teen đến cuối 20s
- nhạy cảm về giá nhưng không chỉ quan tâm giá
- có áp lực thời gian vì cần chốt chỗ ở sớm
- thường tìm theo trường, quận, khu vực, landmark, hoặc trục di chuyển
- dùng mobile nhiều nhưng việc so sánh, đọc thông tin, và chia sẻ link vẫn rất hợp với web
- dễ bị mệt nếu phải lướt quá nhiều listing mà vẫn không chắc đâu là lựa chọn phù hợp

### Pain points của ICP này

- listing quá nhiều nhưng thiếu ngữ cảnh để ra quyết định
- ảnh, mô tả, và context thường không đủ để quyết định có nên liên hệ không
- khó chuyển nhanh từ “xem cho biết” sang “nói chuyện thật”
- nhiều khi người dùng còn chưa rõ nên bắt đầu bằng search, roommate, ROMI hay services

### Vì sao ICP này khớp với MVP hiện tại

Đây là ICP đúng nhất vì MVP hiện tại đã có sẵn gần như đầy đủ các lớp giá trị quan trọng cho hành trình của họ:

- `search` để bắt đầu tìm
- `room detail` để đánh giá
- `messages` để chuyển sang liên hệ thật
- `roommates` để xử lý nhu cầu ở ghép
- `services / deals` để mở rộng giá trị sau khi đã có nhu cầu ở
- `ROMI` để hướng người dùng vào đúng flow
- `RommZ+` để monetize nhóm có intent cao hơn

Nói cách khác, RommZ hiện mạnh nhất khi phục vụ người dùng đang có `housing intent` thật, chứ không chỉ là người lướt xem nội dung.

## 4.2 Primary Persona

### Persona mẫu: Minh, 20 tuổi, sinh viên chuẩn bị chuyển trọ

Minh chuẩn bị vào học kỳ mới và cần tìm phòng ở khu vực thuận tiện cho việc đi học. Minh có ngân sách giới hạn, cần chốt phòng trong thời gian tương đối ngắn, và không muốn lặp lại trải nghiệm cũ là lướt rất nhiều tin nhưng vẫn không biết tin nào đáng liên hệ.

#### Mục tiêu của Minh

- tìm được phòng trong khu vực phù hợp với việc học
- nhanh chóng shortlist một vài lựa chọn thực sự khả thi
- có đủ thông tin để quyết định liên hệ chủ nhà
- nếu cần ở ghép thì có thể tìm roommate phù hợp
- nếu đã gần chốt thì có thêm hỗ trợ về ưu đãi, dịch vụ, hoặc premium

#### Nỗi đau của Minh

- listing nhìn giống nhau, khó phân biệt đâu là lựa chọn tốt
- thông tin thường không trả lời câu hỏi thực tế của Minh
- liên hệ chủ nhà quá sớm thì mất thời gian, nhưng chờ quá lâu thì sợ mất phòng
- chưa chắc biết nên bắt đầu từ trang nào trong sản phẩm

#### “Success” của Minh là gì

- tìm được lựa chọn phù hợp nhanh hơn
- có cảm giác rõ ràng hơn khi xem một listing
- chuyển sang nhắn tin / liên hệ đúng lúc
- cảm nhận rằng RommZ giúp mình ra quyết định, không chỉ bắt mình lướt thêm

## 4.3 Secondary ICP

### ICP phụ

ICP phụ của RommZ là:

> `Host / landlord muốn tiếp cận đúng người thuê, giảm nhiễu khi trao đổi, và quản lý các tương tác liên quan đến listing rõ hơn.`

ICP này là thật và có ý nghĩa vì sản phẩm hiện đã có host flow, host messaging, host dashboard. Tuy nhiên, với `Outcome 1`, nên để demand-side là narrative chính vì:

- dễ demo hơn
- hợp với thesis hiện tại hơn
- đúng với trạng thái web MVP hiện đã sẵn sàng hơn

## 5. Core Value Proposition

## 5.1 Luận điểm cốt lõi

Core value proposition nên dùng cho MVP hiện tại là:

> `RommZ giúp sinh viên và người thuê trẻ tìm phòng rõ hơn và chốt quyết định nhanh hơn.`

Đây là cách diễn đạt bằng tiếng Anh / pitching language. Còn câu tiếng Việt nên dùng nhất quán là:

> `Tìm phòng rõ hơn, chốt nhanh hơn.`

## 5.2 Vì sao value proposition này đúng với RommZ hiện tại

Value proposition trên được chống đỡ bởi bốn trụ giá trị hiện có trong MVP.

### Trụ 1: Discovery rõ hơn

RommZ không chỉ cố gắng cho người dùng thấy “nhiều tin”, mà hướng đến việc giúp họ thấy `đúng tin hơn` và `hiểu tin rõ hơn` qua:

- luồng search
- room detail
- các ngữ cảnh giúp đánh giá listing
- thesis sản phẩm xoay quanh housing intent thật

Đây là phần `rõ hơn`.

### Trụ 2: Hành động nhanh hơn

Khi người dùng đã thấy một lựa chọn phù hợp, sản phẩm giúp họ đi tiếp nhanh hơn qua:

- contact flow
- messaging
- premium entitlement cho nhóm có intent cao

Đây là phần `chốt nhanh hơn`.

### Trụ 3: Hệ sinh thái quanh quyết định thuê trọ

Người dùng không chỉ cần tìm một căn phòng. Họ còn cần:

- roommate phù hợp
- dịch vụ quanh việc chuyển ở
- deal / voucher liên quan
- hỗ trợ định hướng nếu chưa rõ nên làm gì tiếp

Điểm này làm cho RommZ khác với một listing site đơn lẻ.

### Trụ 4: Hướng dẫn bằng ROMI

`ROMI` là lớp hướng người dùng vào đúng flow chứ không nên được mô tả như chatbot chung chung. Vai trò của ROMI trong MVP hiện tại là:

- giải thích RommZ làm được gì
- giúp người dùng mới hiểu nên bắt đầu từ đâu
- đưa người dùng sang action hoặc route phù hợp hơn

Đây là một lớp rất quan trọng vì nhiều user mới không bắt đầu bằng một nhu cầu đã được diễn đạt hoàn hảo.

## 5.3 Câu differentiation nên dùng

Nếu cần nói ngắn gọn RommZ khác gì so với sản phẩm đăng tin thông thường, nên dùng logic sau:

> `RommZ không chỉ giúp xem phòng. RommZ kết nối search, room detail, messaging, roommate, services, ưu đãi, premium và ROMI trong cùng một hành trình ra quyết định thuê trọ.`

Hoặc nói theo ngôn ngữ product:

> `RommZ là housing decision platform ở mức MVP, không chỉ là listing board.`

## 5.4 Những điều không nên overclaim

Để tránh bị người chấm phản biện ngược lại bằng chính trạng thái codebase hiện tại, tài liệu nên chủ động không overclaim:

- mobile chưa phải artifact chính của Outcome 1
- ROMI không phải general chatbot
- premium không nên hứa các quyền lợi chưa thật sự live
- không nên nói sản phẩm đã chứng minh được scale business outcome

Chủ động ghi rõ các giới hạn này thực ra làm tài liệu mạnh hơn, vì nó cho thấy nhóm có tư duy MVP và biết giữ phạm vi thực tế.

## 6. MVP Hiện Tại Đã Có Gì Thật

Để người chấm thấy đây không phải brief lý thuyết, dưới đây là cách brief này map vào chính sản phẩm hiện có.

| Route / Surface | Vai trò trong MVP | Ý nghĩa với thesis |
|---|---|---|
| `/` | landing và định vị giá trị ban đầu | giúp người dùng hiểu RommZ dành cho ai và bắt đầu từ đâu |
| `/login` | vào hệ thống | chốt lớp truy cập cho các flow cần cá nhân hóa |
| `/search` | discovery chính | hiện thực hóa phần `tìm phòng rõ hơn` |
| `/room/:id` | xem chi tiết listing | tăng độ rõ trước khi contact |
| `/messages` | liên hệ và trao đổi | hiện thực hóa phần `chốt nhanh hơn` |
| `/roommates` | nhu cầu ở ghép | mở rộng giá trị vượt khỏi listing |
| `/services` | dịch vụ và deals | kéo dài giá trị sang move-in journey |
| `/community` | lớp cộng đồng / social proof | tăng cảm giác hệ sinh thái sản phẩm |
| `/romi` | guided discovery và onboarding | giúp người dùng đi đúng flow |
| `/payment` | premium conversion | monetize nhóm có nhu cầu cao hơn |

## 6.1 Narrative demo nên dùng

Nếu nhóm muốn tài liệu này ăn khớp với video demo và phần trình bày miệng, narrative tốt nhất là:

1. Người dùng vào RommZ với nhu cầu tìm nơi ở.
2. Họ đi vào search để thu hẹp lựa chọn.
3. Họ mở room detail để đánh giá rõ hơn.
4. Họ chuyển sang contact hoặc messaging để bắt đầu tương tác thật.
5. Nếu nhu cầu phức tạp hơn, họ có thể dùng roommate, ROMI, services, hoặc premium.

Narrative này tốt hơn hẳn kiểu “đây là app của em có rất nhiều feature”.

## 7. Core Metrics Dự Kiến Đo

## 7.1 North Star Metric đề xuất

North Star Metric phù hợp nhất cho MVP hiện tại là:

> `Qualified Housing Decision Actions / tuần`

### Định nghĩa

Đếm số người dùng duy nhất mỗi tuần thực hiện ít nhất một hành động có intent cao, ví dụ:

- liên hệ chủ nhà
- bắt đầu hoặc gửi tin nhắn
- lưu phòng
- gửi roommate request
- bắt đầu service request sau khi đã có housing context
- bắt đầu nâng cấp premium từ một điểm chạm có intent

### Vì sao đây là North Star tốt

Metric này tốt hơn page view hoặc signup đơn thuần vì nó phản ánh trực tiếp việc sản phẩm có đang giúp người dùng tiến gần hơn đến một quyết định thuê trọ hay không.

## 7.2 Metric tree cốt lõi

| Metric | Đo cái gì | Vì sao quan trọng | Cách diễn giải ở giai đoạn MVP |
|---|---|---|---|
| `Search activation rate` | % visitor bắt đầu một search session có ý nghĩa | đo độ rõ của promise ban đầu | thấp nghĩa là landing / onboarding chưa kéo được action |
| `Search -> room detail CTR` | % search session mở ít nhất một room detail | đo độ liên quan của search results | thấp nghĩa là discovery chưa đủ đúng |
| `Room detail -> contact/message conversion` | % người xem detail chuyển sang liên hệ | đo trust và intent thật | đây là một trong các metric quan trọng nhất |
| `Message continuation rate` | % hội thoại được tiếp tục ít nhất thêm một lượt | đo chất lượng contact thật, không chỉ click cho có | giúp phân biệt action giả và action có giá trị |
| `Roommate request conversion` | % người xem hồ sơ roommate gửi greeting / request | đo sức mạnh của lane roommate | quan trọng vì đây là một điểm khác biệt của RommZ |
| `ROMI action CTR` | % session ROMI dẫn tới click vào action gợi ý | đo khả năng hướng luồng của ROMI | rất quan trọng cho onboarding và discovery |
| `Paywall -> payment start rate` | % user chạm gate premium rồi sang payment | đo ý định monetization | cho biết premium có chạm đúng nhu cầu hay không |
| `Payment start -> successful paid rate` | % payment start trở thành thanh toán thành công | đo hiệu quả checkout | cho thấy premium proposition có đủ thuyết phục hay không |
| `D7 return rate` | % user mới quay lại trong 7 ngày | đo khả năng giữ người dùng qua nhiều phiên | quan trọng vì hành trình tìm phòng thường không xong trong một phiên |

## 7.3 Năm metric quan trọng nhất để nói với người chấm

Nếu phải nói ngắn gọn trước evaluator, năm metric nên nhấn mạnh nhất là:

1. `Search activation rate`
2. `Search -> room detail CTR`
3. `Room detail -> contact/message conversion`
4. `ROMI action CTR`
5. `D7 return rate`

Lý do:

- metric 1 đo `activation`
- metric 2 đo `relevance`
- metric 3 đo `conversion`
- metric 4 đo `guided progression`
- metric 5 đo `retention`

Bộ metric này đủ để chứng minh MVP có tư duy sản phẩm chứ không chỉ có giao diện.

## 7.4 Directional pilot targets

Các ngưỡng dưới đây là `target định hướng cho giai đoạn pilot`, không phải số liệu hiện tại của sản phẩm:

| Metric | Target định hướng cho MVP |
|---|---|
| `Search activation rate` | `>= 35%` visitor đủ điều kiện bắt đầu search |
| `Search -> room detail CTR` | `>= 25%` search session mở detail |
| `Room detail -> contact/message conversion` | `>= 8%` user xem detail chuyển sang contact |
| `ROMI action CTR` | `>= 20%` session ROMI có action click |
| `D7 return rate` | `>= 15%` trên nhóm user đã kích hoạt |

Những con số này không nên được nói như “kết quả đã đạt”, mà nên được nói là:

> `đây là measurement target / guardrail để đánh giá chất lượng MVP trong giai đoạn pilot`

## 7.5 Cách nói metric cho đúng và chắc

Nếu người chấm hỏi sâu, cách trả lời chuẩn nên là:

- đây là `core metrics dự kiến đo`
- đây chưa phải `business results đã chứng minh`
- mục tiêu của Outcome 1 là chứng minh sản phẩm có:
  user mục tiêu rõ, giá trị cốt lõi rõ, và framework đo lường rõ

Đây là cách trả lời thực tế và đúng tinh thần MVP.

## 8. Vì sao brief này đáng tin

Brief này đáng tin vì nó bám vào những gì RommZ đang có thật:

- search room
- room detail
- messaging
- roommate flows
- services và deals
- premium entitlements
- ROMI như lớp dẫn luồng

Đồng thời, brief cũng thừa nhận đúng ranh giới hiện tại:

- `web-first MVP bây giờ`
- `mobile parity là phần sau`

Sự trung thực về phạm vi là một điểm cộng lớn khi bị evaluator hỏi sâu.

## 9. Bản tóm tắt 1 đoạn để nói miệng

Nếu cần một đoạn nói nhanh trước người chấm, có thể dùng nguyên văn:

> `RommZ là web-first MVP dành cho sinh viên và người thuê trẻ đang cần tìm phòng rõ hơn và chốt quyết định nhanh hơn. ICP chính của bọn em là nhóm user có nhu cầu thuê trọ thật trong ngắn hạn, quan tâm đến độ rõ ràng, độ tin cậy và tốc độ ra quyết định, chứ không chỉ xem thật nhiều listing. Giá trị cốt lõi của RommZ là kết nối search, room detail, messaging, roommate, services, premium và ROMI trong cùng một hành trình thuê trọ. Các metric bọn em dự kiến đo gồm search activation, search-to-detail CTR, detail-to-contact conversion, ROMI action CTR và D7 retention.` 

## 10. Checklist đáp ứng Outcome 1.3

Tài liệu này đã đáp ứng đủ ba ý bắt buộc:

- `Persona / ICP`: đã có ở Mục 4
- `Core value proposition`: đã có ở Mục 5
- `Core metrics dự kiến đo`: đã có ở Mục 7

Với trạng thái hiện tại của dự án, đây là cách trình bày đầy đủ, chi tiết, đúng thực tế, và phù hợp nhất để nộp cho `Outcome 1 / item 3`.
