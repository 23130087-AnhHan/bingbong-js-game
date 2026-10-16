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

Bóng chờ trên thanh đỡ khi bắt đầu màn hoặc sau khi mất mạng. Bạn có thể di chuyển thanh đỡ trước khi phát bóng. Mỗi màn bắt đầu với 3 mạng; khi có nhiều bóng, chỉ mất mạng khi toàn bộ bóng rơi khỏi sân.

Trò chơi tự tạm dừng khi bạn chuyển sang cửa sổ hoặc thẻ khác. Khi quay lại, nhấn C để tiếp tục.

## Vật phẩm

- **+1:** thêm một mạng, tối đa 5 mạng.
- **↔:** mở rộng thanh đỡ.
- **↓:** làm chậm bóng.

## Các màn chơi

Màn 1–7 đã có cơ chế riêng: phá gạch cơ bản, gạch nhiều máu, gạch di chuyển, vật phẩm, gạch nổ, nhiều bóng và gạch thép.

Màn 8–10 đang phát triển, được đánh dấu trong menu và hiện có thể chơi thử với bố cục gạch cơ bản.
