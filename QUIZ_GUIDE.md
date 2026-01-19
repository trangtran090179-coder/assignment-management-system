# Hướng Dẫn Sử Dụng Chức Năng Quiz Trắc Nghiệm

## Tổng Quan

Hệ thống Quiz Trắc Nghiệm cho phép giáo viên tạo bài kiểm tra trắc nghiệm với tính năng tự động chấm điểm và hiển thị kết quả chi tiết cho học sinh.

## Tính Năng Chính

### Dành cho Giáo Viên:
- Tạo quiz với nhiều câu hỏi trắc nghiệm
- Hỗ trợ 2-6 đáp án cho mỗi câu hỏi
- Thêm giải thích cho đáp án đúng
- Thiết lập thời gian làm bài (hoặc không giới hạn)
- Xáo trộn thứ tự câu hỏi và đáp án
- Cho phép/không cho phép xem đáp án sau khi nộp
- Xem danh sách kết quả của học sinh
- Tự động chấm điểm

### Dành cho Học Sinh:
- Làm bài quiz trắc nghiệm
- Đếm ngược thời gian làm bài
- Hiển thị tiến độ làm bài
- Xem kết quả chi tiết (nếu giáo viên cho phép)
- Xem giải thích đáp án đúng
- In kết quả

## Hướng Dẫn Sử Dụng

### A. GIÁO VIÊN - Tạo Quiz

#### Cách 1: Tạo Quiz Thủ Công

##### 1. Vào Dashboard
- Đăng nhập với tài khoản giáo viên
- Vào trang Teacher Dashboard

#### 2. Tạo Quiz Mới
- Click nút **"Tạo Quiz trắc nghiệm"**
- Chọn lớp học muốn giao quiz

#### 3. Điền Thông Tin Quiz
**Thông tin cơ bản:**
- **Tiêu đề**: Tên bài kiểm tra (VD: Kiểm tra giữa kỳ Toán học)
- **Mô tả**: Mô tả ngắn về nội dung (không bắt buộc)
- **Hạn nộp**: Chọn ngày và giờ hạn nộp bài
- **Thời gian làm bài**: Nhập số phút (0 = không giới hạn)

**Tùy chọn:**
- Hiển thị đáp án sau khi nộp bài
- Xáo trộn thứ tự câu hỏi
- Xáo trộn thứ tự đáp án

#### 4. Thêm Câu Hỏi
**Cho mỗi câu hỏi:**
1. Nhập nội dung câu hỏi
2. Nhập các đáp án (tối thiểu 2, tối đa 6)
3. Chọn đáp án đúng bằng radio button
4. Thêm giải thích (không bắt buộc)

**Thao tác:**
- Click **"Thêm câu hỏi"** để thêm câu mới
- Click **"Xóa"** để xóa câu hỏi
- Click **"Thêm đáp án"** để thêm đáp án cho câu hỏi
- Click **"X"** để xóa đáp án

#### 5. Hoàn Thành
- Kiểm tra lại thông tin
- Click **"Tạo Quiz"**
- Hệ thống sẽ thông báo tạo thành công

#### Cách 2: Import Quiz từ File Word (MỚI)

##### 1. Chuẩn Bị File Word
**Định dạng file:**
```
Câu 1: Nội dung câu hỏi?
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D
Đáp án: B
Giải thích: Giải thích tại sao B đúng (tùy chọn)

Câu 2: Câu hỏi tiếp theo?
A. Đáp án A
B. Đáp án B
C. Đáp án C
Đáp án: A
```

**Lưu ý quan trọng:**
- Mỗi câu hỏi bắt đầu bằng "Câu" + số thứ tự
- Đáp án bắt đầu bằng A, B, C, D (tối đa F)
- Dòng "Đáp án:" chỉ rõ đáp án đúng
- "Giải thích:" là tùy chọn
- Có thể có 2-6 đáp án cho mỗi câu

##### 2. Vào Dashboard
- Đăng nhập với tài khoản giáo viên
- Click nút **"Import Quiz từ Word"**
- Chọn lớp học

##### 3. Upload File
- Click **"Tải file mẫu"** nếu chưa có template
- Click vào vùng upload hoặc chọn file (.doc, .docx)
- Tối đa 10MB
- Click **"Parse File"**

##### 4. Preview Câu Hỏi
- Xem trước tất cả câu hỏi đã parse
- Đáp án đúng được đánh dấu màu xanh
- Kiểm tra kỹ trước khi tiếp tục

##### 5. Điền Thông Tin Quiz
- Tiêu đề quiz
- Mô tả (tùy chọn)
- Hạn nộp
- Thời gian làm bài
- Tùy chọn hiển thị đáp án

##### 6. Hoàn Tất
- Click **"Tạo Quiz"**
- Quiz được tạo với tất cả câu hỏi từ file Word

**Ưu điểm của Import từ Word:**
- Nhanh chóng - tạo hàng chục câu hỏi trong vài giây
- Dễ soạn - dùng Word quen thuộc
- Tái sử dụng - dùng lại ngân hàng câu hỏi có sẵn
- Chính xác - ít lỗi hơn nhập tay

### B. GIÁO VIÊN - Quản Lý Quiz

#### Xem Danh Sách Quiz
- Vào Teacher Dashboard
- Xem phần **"Quiz Trắc nghiệm gần đây"**
- Hiển thị:
  - Tiêu đề quiz
  - Lớp học
  - Số câu hỏi
  - Thời gian làm bài
  - Số học sinh đã làm

#### Xem Kết Quả
- Click nút **"Xem kết quả"** trên quiz
- Xem danh sách học sinh và điểm số
- Sắp xếp theo điểm từ cao xuống thấp

#### Xóa Quiz
- Click nút **"Xóa"** trên quiz
- Xác nhận xóa
- Quiz sẽ bị xóa vĩnh viễn

### C. HỌC SINH - Làm Quiz

#### 1. Vào Dashboard
- Đăng nhập với tài khoản học sinh
- Vào Student Dashboard

#### 2. Tìm Quiz
- Xem phần **"Quiz Trắc nghiệm"**
- Quiz hiển thị với:

### Cấu Trúc Chuẩn

```
Câu [số]: [Nội dung câu hỏi]
A. [Đáp án A]
B. [Đáp án B]
C. [Đáp án C]
D. [Đáp án D]
Đáp án: [A/B/C/D]
Giải thích: [Giải thích] (tùy chọn)
```

### Ví Dụ Chi Tiết

```
Câu 1: Thủ đô của Việt Nam là gì?
A. Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Huế
Đáp án: B
Giải thích: Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.

Câu 2: 2 + 2 = ?
A. 3
B. 4
C. 5
D. 6
Đáp án: B

Câu 3: HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Tech Modern Language
C. Home Tool Markup Language
Đáp án: A
```

### Quy Tắc Quan Trọng

1. **Số thứ tự câu hỏi**: Phải có "Câu" + số (VD: Câu 1, Câu 2...)
2. **Đáp án**: Bắt đầu bằng chữ cái A, B, C, D, E, F
3. **Đáp án đúng**: Dòng riêng với format "Đáp án: [chữ cái]"
4. **Giải thích**: Tùy chọn, bắt đầu bằng "Giải thích:"
5. **Khoảng trắng**: Có thể có nhiều dòng trống giữa các câu
6. **Số đáp án**: Tối thiểu 2, tối đa 6 đáp án

### Lỗi Thường Gặp

**SAI:**
```
1. Câu hỏi này?  // Thiếu từ "Câu"
- Đáp án A       // Dùng dấu - thay vì A.
Đúng: B          // Không có "Đáp án:"
```

**ĐÚNG:**
```
Câu 1: Câu hỏi này?
A. Đáp án A
B. Đáp án B
Đáp án: B
```

## uiz hiển thị với:
  - Tiêu đề
  - Số câu hỏi
  - Thời gian làm bài
  - Hạn nộp
  - Trạng thái (Chưa làm/Đã làm/Quá hạn)

#### 3. Bắt Đầu Làm Bài
- Click vào quiz chưa làm
- Đọc kỹ thông tin quiz
- Nếu có giới hạn thời gian, đồng hồ đếm ngược sẽ bắt đầu

#### 4. Trả Lời Câu Hỏi
**Giao diện làm bài:**
- Mỗi câu hỏi hiển thị riêng biệt
- Chọn một đáp án bằng radio button
- Thanh tiến độ hiển thị số câu đã trả lời
- Có thể xem lại và đổi đáp án trước khi nộp

**Lưu ý:**
- Nếu có giới hạn thời gian, xem đồng hồ đếm ngược ở trên cùng
- Câu đã trả lời sẽ có badge "Đã trả lời"
- Hệ thống cảnh báo nếu còn câu chưa trả lời

#### 5. Nộp Bài
- Click nút **"Nộp bài"**
- Nếu còn câu chưa trả lời, hệ thống hỏi xác nhận
- Click **"OK"** để xác nhận nộp bài

#### 6. Xem Kết Quả
**Điểm số:**
- Điểm hiển thị ở giữa màn hình (scale /100)
- Số câu đúng/tổng số câu
- Thời gian làm bài
- Thời gian nộp
**Chi tiết đáp án (nếu giáo viên cho phép):**
- Đáp án của bạn
- Đáp án đúng (màu xanh)
- Đáp án sai (màu đỏ)
- Giải thích (nếu có)

**Thao tác:**
- Click **"In kết quả"** để in
- Click **"Quay lại"** để về dashboard

## Thống Kê & Báo Cáo

### Cho Giáo Viên:
- Số học sinh đã làm quiz
- Điểm số của từng học sinh
- Thời gian làm bài
- Sắp xếp theo điểm số

### Cho Học Sinh:
- Điểm số cá nhân
- Số câu đúng/sai
- Thời gian làm bài
- Chi tiết từng câu trả lời

## Giao Diện

Giao diện được thiết kế hiện đại, thân thiện với người dùng:
- **Màu sắc:** 
  - Xanh lá (#4CAF50) cho quiz
  - Xanh dương (#1976d2) cho các thành phần chính
  - Đỏ (#f44336) cho lỗi/quá hạn
- **Icons:** Emoji và icon trực quan
- **Responsive:** Tương thích nhiều kích thước màn hình
- **Animations:** Hiệu ứng mượt mà

## Bảo Mật

- Đáp án đúng chỉ gửi xuống client khi xem kết quả
- Học sinh không thể xem đáp án trong khi làm bài
- Mỗi học sinh chỉ được làm quiz 1 lần
- Tự động nộp bài khi hết giờ

## Lưu Ý

1. **Thời gian làm bài:**
   - Nếu đặt thời gian = 0, học sinh có thể làm không giới hạn
   - Khi hết giờ, bài làm tự động nộp

2. **Xáo trộn:**
   - Xáo trộn câu hỏi: thứ tự câu hỏi khác nhau cho mỗi học sinh
   - Xáo trộn đáp án: thứ tự đáp án khác nhau

3. **Hiển thị đáp án:**
   - Nếu không cho phép, học sinh chỉ thấy điểm số
   - Nếu cho phép, học sinh thấy chi tiết đáp án đúng/sai

4. **Chỉnh sửa Quiz:**
   - Chưa hỗ trợ chỉnh sửa quiz sau khi tạo
   - Cần xóa và tạo lại nếu muốn sửa

5. **Nộp bài:**
   - Mỗi học sinh chỉ được nộp 1 lần
   - Không thể làm lại sau khi đã nộp

## Xử Lý Sự Cố

### Học sinh không thấy quiz:
- Kiểm tra đã tham gia đúng lớp chưa
- Reload lại trang
- Liên hệ giáo viên

### Không nộp được bài:
- Kiểm tra kết nối internet
- Kiểm tra đã chọn đáp án cho tất cả câu hỏi
- # Lỗi khi Import từ Word:
- Kiểm tra định dạng file có đúng không
- Tải file mẫu để tham khảo
- Đảm bảo mỗi câu hỏi có "Câu" + số thứ tự
- Đảm bảo có dòng "Đáp án: [chữ cái]"
- File không quá 10MB
- Chỉ dùng file .doc hoặc .docx

### File Word không parse được:
- Mở file trong Word và "Save As" lại với format .docx
- Xóa các định dạng phức tạp (bảng, hình ảnh)
- Đảm bảo text thuần túy, không có ký tự đặc biệt
- Copy nội dung vào file mới tạo

- Thử lại sau vài giây

### Không xem được kết quả:
- Kiểm tra giáo viên có cho phép xem đáp án không
- Reload lại trang

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước trong hướng dẫn
2. Reload lại trang
3. Đăng xuất và đăng nhập lại
4. Liên hệ quản trị viên hệ thống

---

**Chúc bạn sử dụng hiệu quả!**
