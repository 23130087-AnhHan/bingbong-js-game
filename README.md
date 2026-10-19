# BingBong – Trò chơi phá gạch

Đồ án giữa kỳ môn Lập trình giao diện web, xây dựng bằng HTML5, CSS3 và JavaScript thuần với Canvas API.

## Cách chạy

Mở `index.html` bằng trình duyệt hoặc chạy qua máy chủ web cục bộ của trình soạn thảo. Dự án không cần cài thư viện hay biên dịch.

## Cách chơi

Di chuyển thanh đỡ để giữ bóng trong sân và phá hết các viên gạch có thể phá. Gạch thép không tính vào điều kiện qua màn. Mỗi lần gây sát thương lên gạch được 10 điểm.

| Thao tác | Điều khiển |
| --- | --- |
| Chọn màn | Nhấp chuột, hoặc dùng phím mũi tên rồi nhấn Enter |
| Chọn nhanh màn 1–9 | Phím 1–9 |
| Chọn nhanh màn 10 | Phím 0 |
| Di chuyển thanh đỡ | Rê chuột trong sân, phím A/D hoặc ←/→ |
| Phát bóng | Nhấp trong sân hoặc nhấn Space (phím cách) |
| Tạm dừng | Phím P |
| Tiếp tục | Phím C |
| Về màn hình chọn màn | Phím M |
| Sang màn tiếp theo sau khi thắng | Phím Enter |
| Chơi lại sau khi thua | Phím R |

Bóng chờ trên thanh đỡ khi bắt đầu màn hoặc sau khi toàn bộ bóng rơi khỏi sân. Bạn có thể di chuyển thanh đỡ trước khi phát bóng. Các màn hiện tại đều bắt đầu với một bóng.

Mỗi màn bắt đầu với 3 mạng, điểm số và thời gian được tính lại từ đầu. Khi có nhiều bóng, rơi một bóng không làm mất mạng; chỉ khi toàn bộ bóng rơi khỏi sân mới mất một mạng và chuẩn bị phát bóng lại. Vật phẩm mất mạng sẽ trừ một mạng ngay khi nhặt. Hết mạng thì thua màn.

Trò chơi tự tạm dừng khi bạn chuyển sang cửa sổ hoặc thẻ khác. Khi quay lại, nhấn C để tiếp tục.

HUD hiển thị số mạng, màn chơi, điểm, thời gian, số gạch còn lại, số bóng và thời gian hiệu ứng đang có. Màn 6 có thêm đếm ngược lần hạ tường tiếp theo, chuyển sang màu đỏ trong hai giây cuối. Thời gian chơi, thời hạn hiệu ứng và đếm ngược hạ tường chỉ chạy khi bóng đã được phát và trò chơi không tạm dừng. Điểm và thời gian cũng được hiển thị khi thắng hoặc thua.

## Vật phẩm

Di chuyển thanh đỡ để đón vật phẩm có lợi màu xanh lá và tránh vật phẩm có hại màu đỏ. Vật phẩm được nhận khi chạm thanh đỡ.

| Nhóm | Ký hiệu | Tác dụng |
| --- | --- | --- |
| Có lợi – xanh lá | +1♥ | Thêm một mạng; chỉ rơi tối đa một lần mỗi lượt chơi màn 4 hoặc 5 |
| Có lợi – xanh lá | ↔ | Mở rộng thanh đỡ trong 10 giây |
| Có lợi – xanh lá | ↓ | Giảm tốc toàn bộ bóng còn 85% tốc độ cơ bản của màn trong 10 giây |
| Có lợi – xanh lá | +1● | Thêm một bóng |
| Có hại – đỏ | -1♥ | Chỉ có ở màn 7, xuất hiện ít hơn các vật phẩm đỏ khác; mất một mạng ngay lập tức, hết mạng thì thua |
| Có hại – đỏ | >< | Thu ngắn thanh đỡ trong 6 giây |
| Có hại – đỏ | ↑ | Tăng tốc toàn bộ bóng lên 112% tốc độ cơ bản của màn trong 6 giây |

Hiệu ứng dài/ngắn thanh đỡ thay thế nhau; hiệu ứng nhanh/chậm bóng cũng thay thế nhau. Nhặt lại vật phẩm cùng hiệu ứng sẽ đặt lại thời hạn thành 10 giây với hiệu ứng có lợi hoặc 6 giây với hiệu ứng có hại, không cộng dồn mức tác dụng. Hiệu ứng thanh đỡ và hiệu ứng tốc độ bóng có thể tồn tại đồng thời.

Khi hết thời hạn, thanh đỡ hoặc tốc độ bóng trở về mức cơ bản của màn. Các hiệu ứng này cũng được xóa khi toàn bộ bóng rơi khỏi sân, bắt đầu màn mới hoặc chơi lại.

Tối đa có 2 bóng trong sân. Vật phẩm thêm bóng không rơi khi đã đủ hai bóng; bóng mới tồn tại cho đến khi rơi khỏi sân hoặc màn chơi được đặt lại. Vật phẩm thêm hai bóng không được sử dụng trong màn 1–7.

Vật phẩm rơi ngẫu nhiên khi phá gạch ở màn 4–7. Mạng và bóng bổ sung có trọng số thấp hơn các hiệu ứng tạm thời để hạn chế trợ giúp quá nhiều. Giới hạn rơi thêm mạng được tính cho cả lượt chơi màn, không đặt lại sau khi mất bóng; vật phẩm không nhặt được vẫn tính vào giới hạn này. Màn 6–7 không có vật phẩm thêm mạng.

| Màn | Tỷ lệ rơi vật phẩm khi phá gạch | Tỷ lệ chọn nhóm có hại trong lần rơi thông thường |
| --- | --- | --- |
| 4 | 22% | 25% |
| 5 | 23% | 35% |
| 6 | 24% | 40% |
| 7 | 25% | 45% |

Ngoài các lần rơi thông thường, mỗi viên gạch nổ bị phá còn thả một vật phẩm có hại rơi nhanh hơn 20%. Vật phẩm này được chọn trong các loại có hại của màn hiện tại.

## Các màn chơi

| Màn | Tên | Cơ chế chính | Tốc độ bóng ban đầu so với màn 1 |
| --- | --- | --- | --- |
| 1 | Phá gạch cơ bản | Gạch một lần chạm, làm quen điều khiển và góc bật | 1,00× |
| 2 | Lớp giáp kiên cố | Hai lối mở ở hàng dưới dẫn tới nhóm gạch cứng; gạch cần từ một đến ba lần chạm để phá | 1,03× |
| 3 | Đội hình di động | Đội hình gạch nhiều máu di chuyển ngang và đổi chiều | 1,06× |
| 4 | Cơn mưa vật phẩm | Gạch nhiều máu di chuyển, kết hợp vật phẩm có lợi và có hại | 1,09× |
| 5 | Vụ nổ dây chuyền | Hai cụm bom nhỏ giúp dọn từng khu vực, đồng thời thả vật phẩm có hại; đội hình gạch di chuyển | 1,12× |
| 6 | Bức tường hạ dần | Tường trượt ngang, hạ 18 px mỗi 12 giây đến tối đa 126 px; chỉ có hai viên gạch nổ, thanh đỡ rộng 110 px | 1,16× |
| 7 | Pháo đài thép | Bảy hàng gạch với nhiều gạch 2–3 máu, gạch thép di động có các lối mở; hai viên gạch nổ, thanh đỡ rộng 100 px và vật phẩm trừ mạng | 1,20× |

Mỗi màn có cùng mục tiêu: phá hết gạch có thể phá. Gạch thép chỉ là vật cản, không cần phá để thắng. Thanh đỡ cơ bản rộng 120 px ở màn 1–5. Tốc độ gạch di chuyển tăng từ 75 px/giây ở màn 3–4 lên 80, 85 và 90 px/giây ở màn 5, 6 và 7.

Màn 8–10 đang phát triển, được đánh dấu trong menu và hiện có thể chơi thử với bố cục gạch cơ bản.
