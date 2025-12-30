# Hướng Dẫn Sử Dụng - Vocabulary Games

## Mục Lục
- [Khởi động](#khởi-động)
- [Các chế độ chơi](#các-chế-độ-chơi)
- [Bảng Xếp Hạng & Vòng Quay](#bảng-xếp-hạng--vòng-quay)
- [Tích hợp với Markdown Viewer](#tích-hợp-với-markdown-viewer)
- [Timer Widget](#timer-widget)
- [Phím tắt](#phím-tắt)
- [Server API](#server-api)

---

## Khởi động

### Chạy Game
```bash
# Mở file index.html trong trình duyệt
# Hoặc sử dụng live server

cd v2/
npx serve .
# Truy cập: http://localhost:3000
```

### Chạy Server (lưu dữ liệu)
```bash
cd v2/server
npm install
npm start
# Server chạy tại: http://localhost:3007
```

### Chạy Tests
```bash
cd v2/server
npm test              # Chạy với coverage
npm run test:watch    # Watch mode
```

---

## Các Chế Độ Chơi

| Phím | Chế độ | Mô tả |
|------|--------|-------|
| `1` | Flashcard | Lật thẻ học từ vựng |
| `2` | Ghép Nghĩa | Nối từ với nghĩa |
| `3` | Phát Âm | Nghe và chọn từ đúng |
| `4` | Word Blitz | Trả lời nhanh trong thời gian giới hạn |
| `5` | Thử Thách Hàng Ngày | Bài kiểm tra hàng ngày |
| `6` | Thi Đấu Lớp Học | Chơi theo nhóm, hot seat |
| `7` | Theo Dõi Tiến Độ | Dashboard giáo viên |
| `8` | Bảng Xếp Hạng | Thưởng điểm, vòng quay may mắn |

---

## Bảng Xếp Hạng & Vòng Quay

### Truy cập
- Bấm phím `8` từ menu chính
- Hoặc click vào "🏅 Bảng Xếp Hạng"

### Tính năng

#### 1. Quản lý điểm
- Click vào tên học sinh để chọn
- Bấm `+` để thưởng 5 điểm
- Bấm `-` để trừ 5 điểm
- Sử dụng nút "+5", "+10", "+20" ở dưới để thưởng nhanh

#### 2. Vòng Quay May Mắn 🎡
1. Chọn học sinh (click vào tên)
2. Bấm "🎯 QUAY!"
3. Các giải thưởng:
   - **+5, +10, +15, +20, +25, +30**: Cộng điểm tương ứng
   - **x2**: Nhân đôi điểm session hiện tại
   - **🎁 Jackpot**: +50 điểm!

#### 3. Quản lý Session
- **Session mới**: Reset điểm session, giữ nguyên tổng điểm
- **Reset điểm**: Xóa tất cả điểm về 0

### Lưu ý
- Dữ liệu tự động lưu khi server chạy
- Không có server → dữ liệu lưu trong localStorage

---

## Tích hợp với Markdown Viewer

### Cách sử dụng
Khi đang xem bài học trong Markdown Viewer:

| Phím | Chức năng |
|------|-----------|
| `G` | Mở menu game với từ vựng bài đang xem |
| `Shift+G` | Mở ngay Thi Đấu Lớp Học |

### Cách hoạt động
- Game tự động nhận diện grade/unit từ đường dẫn file
- Ví dụ: `g11/unit-5-reading.md` → Grade 11, Unit 5
- Từ vựng được tự động chọn theo bài học

### URL Parameters
Có thể mở game trực tiếp với parameters:
```
index.html?grade=11&unit=5&mode=classroom
index.html?mode=leaderboard&classId=10A1
```

---

## Timer Widget

### Bật/Tắt
- Bấm `Alt+T` để toggle timer
- Hoặc click vào icon đồng hồ

### Sử dụng
1. **Thời gian preset**: 1, 2, 3, 5, 10 phút
2. **Thời gian tùy chỉnh**: Nhập số phút vào ô input
3. **Điều khiển**:
   - ▶️ Bắt đầu
   - ⏸️ Tạm dừng
   - 🔄 Reset

### Chế độ Fullscreen
- **Double-click** vào timer để phóng to toàn màn hình
- Hiển thị lớn trên TV/màn chiếu
- Double-click lần nữa để thu nhỏ

### Âm thanh cảnh báo
- 🔔 30 giây cuối: Thanh progress chuyển vàng
- 🔔 10 giây cuối: Thanh progress chuyển đỏ + tiếng tích
- 🔔 Hết giờ: Tiếng chuông báo

---

## Phím Tắt

### Menu chính
| Phím | Chức năng |
|------|-----------|
| `1-8` | Chọn chế độ chơi |
| `L` | Đổi bài học |
| `ESC` | Quay lại menu |

### Trong game
| Phím | Chức năng |
|------|-----------|
| `Space` | Tiếp tục / Xác nhận |
| `Enter` | Xác nhận lựa chọn |
| `ESC` | Thoát về menu |

### Markdown Viewer
| Phím | Chức năng |
|------|-----------|
| `G` | Mở game menu |
| `Shift+G` | Mở Classroom Battle |
| `Alt+T` | Toggle timer |

---

## Server API

### Health Check
```bash
curl http://localhost:3007/health
```

### Leaderboard

#### Lấy bảng xếp hạng
```bash
curl http://localhost:3007/api/leaderboard/10A1
```

#### Thêm học sinh
```bash
curl -X POST http://localhost:3007/api/leaderboard/10A1/students \
  -H "Content-Type: application/json" \
  -d '{"students": ["Nguyễn Văn A", "Trần Thị B"]}'
```

#### Cộng/trừ điểm
```bash
curl -X POST http://localhost:3007/api/leaderboard/10A1/points \
  -H "Content-Type: application/json" \
  -d '{"studentName": "Nguyễn Văn A", "points": 10, "reason": "Trả lời tốt"}'
```

#### Ghi nhận quay vòng quay
```bash
curl -X POST http://localhost:3007/api/leaderboard/10A1/spin \
  -H "Content-Type: application/json" \
  -d '{"studentName": "Nguyễn Văn A", "prize": {"label": "+10", "points": 10}}'
```

#### Bắt đầu session mới
```bash
curl -X POST http://localhost:3007/api/leaderboard/10A1/session \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "Tiết 3", "resetPoints": false}'
```

### Lớp học

```bash
# Lấy danh sách lớp
curl http://localhost:3007/api/classes

# Tạo/cập nhật lớp
curl -X POST http://localhost:3007/api/classes/10A1 \
  -H "Content-Type: application/json" \
  -d '{"students": ["HS1", "HS2"], "grade": 10}'

# Xóa lớp
curl -X DELETE http://localhost:3007/api/classes/10A1
```

### Kết quả thi đấu

```bash
# Lưu kết quả
curl -X POST http://localhost:3007/api/results \
  -H "Content-Type: application/json" \
  -d '{"classId": "10A1", "players": [{"name": "Team A", "score": 100}]}'

# Lấy kết quả
curl http://localhost:3007/api/results/10A1
```

### Thống kê

```bash
# Dashboard tổng quan
curl http://localhost:3007/api/dashboard

# Thống kê lớp
curl http://localhost:3007/api/stats/10A1

# Từ cần ôn tập
curl http://localhost:3007/api/review-quiz/10A1?limit=10
```

---

## Âm thanh lớp học 🔊

Game tích hợp các hiệu ứng âm thanh:

| Âm thanh | Khi nào |
|----------|---------|
| 👏 Applause | Trả lời đúng, hoàn thành |
| 🎺 Fanfare | Jackpot, thành tích lớn |
| 🥁 Drumroll | Đang quay vòng quay |
| ⏰ Countdown | 3-2-1-GO! |
| 🔔 Times Up | Hết giờ |
| ❌ Buzzer | Trả lời sai |

---

## Tips cho Giáo viên

### Thi đấu lớp học hiệu quả
1. Chia lớp thành 2-4 đội
2. Sử dụng mode "Thi Đấu Lớp Học" (phím 6)
3. Chuyền bàn phím giữa các đội
4. Dùng Timer widget để giới hạn thời gian mỗi lượt

### Thưởng điểm sáng tạo
1. Mở Bảng Xếp Hạng (phím 8)
2. Thưởng điểm cho:
   - Trả lời nhanh nhất
   - Giúp đỡ bạn
   - Phát âm chuẩn
3. Cuối tiết cho học sinh quay vòng quay may mắn

### Ôn tập từ khó
1. Mở "Theo Dõi Tiến Độ" (phím 7)
2. Xem từ nào lớp hay sai
3. Tạo quiz ôn tập từ những từ đó

---

## Troubleshooting

### Game không load từ vựng
- Kiểm tra file `js/data/vocabulary-data.js`
- Đảm bảo format đúng

### Server không lưu dữ liệu
- Kiểm tra server đang chạy: `curl http://localhost:3007/health`
- Kiểm tra thư mục `v2/server/data/` có quyền ghi

### Âm thanh không phát
- Trình duyệt cần user interaction trước khi phát audio
- Click vào game trước khi bắt đầu

---

**Happy Teaching! 📚**
