# 📤 Import Quiz từ File Word - Tính Năng Mới

## Tổng Quan

Chức năng **Import Quiz từ File Word** cho phép giáo viên tạo quiz trắc nghiệm nhanh chóng bằng cách upload file Word (.doc, .docx). Hệ thống sẽ tự động parse và chuyển đổi nội dung thành quiz.

## ✨ Tính Năng

- ⚡ **Nhanh chóng**: Tạo hàng chục câu hỏi trong vài giây
- 📝 **Dễ dùng**: Soạn câu hỏi trong Word quen thuộc
- 🔄 **Tái sử dụng**: Dùng lại ngân hàng câu hỏi có sẵn
- 👁️ **Preview**: Xem trước câu hỏi trước khi tạo quiz
- ✅ **Chính xác**: Tự động parse và validate

## 🚀 Cách Sử Dụng

### 1. Chuẩn Bị File Word

Tạo file Word với định dạng:

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

Câu 3: Python là ngôn ngữ lập trình gì?
A. Compiled language
B. Interpreted language
C. Assembly language
Đáp án: B
Giải thích: Python là ngôn ngữ thông dịch.
```

### 2. Import Vào Hệ Thống

1. Vào Teacher Dashboard
2. Click **"📤 Import Quiz từ Word"**
3. Chọn lớp học
4. Click **"📥 Tải file mẫu"** (nếu cần tham khảo)
5. Upload file Word
6. Click **"🔍 Parse File"**
7. Xem preview câu hỏi
8. Điền thông tin quiz (tiêu đề, hạn nộp, thời gian)
9. Click **"✅ Tạo Quiz"**

## 📋 Quy Tắc Định Dạng

### Bắt Buộc

1. **Câu hỏi**: Bắt đầu bằng `Câu [số]:`
   ```
   Câu 1: Nội dung câu hỏi?
   Câu 2: Câu hỏi tiếp theo?
   ```

2. **Đáp án**: Bắt đầu bằng chữ cái (A-F) + dấu chấm hoặc dấu hai chấm
   ```
   A. Đáp án A
   B. Đáp án B
   hoặc
   A: Đáp án A
   B: Đáp án B
   ```

3. **Đáp án đúng**: Dòng riêng với format `Đáp án: [chữ cái]`
   ```
   Đáp án: A
   hoặc
   Answer: B
   Correct: C
   ```

### Tùy Chọn

4. **Giải thích**: Bắt đầu bằng `Giải thích:` hoặc `Explanation:`
   ```
   Giải thích: Lý do tại sao đáp án này đúng
   ```

### Linh Hoạt

- **Số đáp án**: 2-6 đáp án (A-F)
- **Khoảng trắng**: Có thể có nhiều dòng trống
- **Độ dài**: Không giới hạn độ dài câu hỏi/đáp án

## ✅ Ví Dụ Đúng

### Ví Dụ 1: Đầy Đủ
```
Câu 1: Ai là người phát minh ra bóng đèn điện?
A. Nikola Tesla
B. Thomas Edison
C. Benjamin Franklin
D. Alexander Graham Bell
Đáp án: B
Giải thích: Thomas Edison được biết đến với việc phát triển và thương mại hóa bóng đèn điện.
```

### Ví Dụ 2: Không Có Giải Thích
```
Câu 2: 5 x 6 = ?
A. 25
B. 30
C. 35
D. 40
Đáp án: B
```

### Ví Dụ 3: 3 Đáp Án
```
Câu 3: CSS là viết tắt của gì?
A. Cascading Style Sheets
B. Computer Style Sheets
C. Creative Style Sheets
Đáp án: A
```

### Ví Dụ 4: 6 Đáp Án
```
Câu 4: Ngôn ngữ nào sau đây là OOP?
A. C
B. Java
C. Python
D. C++
E. JavaScript
F. Assembly
Đáp án: B
```

## ❌ Lỗi Thường Gặp

### 1. Thiếu Từ "Câu"
```
❌ SAI:
1: Câu hỏi này?
Question 1: Câu hỏi này?

✅ ĐÚNG:
Câu 1: Câu hỏi này?
```

### 2. Đáp Án Sai Format
```
❌ SAI:
- Đáp án A
* Đáp án B
1. Đáp án C

✅ ĐÚNG:
A. Đáp án A
B. Đáp án B
C. Đáp án C
```

### 3. Không Có Dòng "Đáp án:"
```
❌ SAI:
Câu 1: Câu hỏi?
A. Đáp án A
B. Đáp án B (đúng)

✅ ĐÚNG:
Câu 1: Câu hỏi?
A. Đáp án A
B. Đáp án B
Đáp án: B
```

### 4. Đáp Án Không Khớp
```
❌ SAI:
A. Đáp án A
B. Đáp án B
Đáp án: C  // Không có đáp án C

✅ ĐÚNG:
A. Đáp án A
B. Đáp án B
C. Đáp án C
Đáp án: C
```

## 🔧 Kỹ Thuật

### Backend

**Controller**: `server/src/controllers/quizImportController.ts`
- Parse file Word bằng thư viện `mammoth`
- Extract text và phân tích cấu trúc
- Validate câu hỏi và đáp án
- Trả về JSON array của questions

**Routes**: `server/src/routes/quizImportRoutes.ts`
- POST `/api/quiz-import/parse-word` - Upload và parse file
- GET `/api/quiz-import/template` - Download file mẫu
- Sử dụng `multer` cho upload
- Giới hạn: 10MB, chỉ .doc/.docx

### Frontend

**Component**: `client/src/components/ImportQuizModal.tsx`
- Upload file với drag & drop
- Hiển thị progress
- Preview câu hỏi sau khi parse
- Form nhập thông tin quiz
- Tích hợp với API

### Algorithm Parse

```typescript
1. Upload file → server
2. Mammoth extract text từ .docx
3. Split text thành lines
4. Loop qua từng line:
   - Detect "Câu [số]:" → new question
   - Detect "[A-F]." → add option
   - Detect "Đáp án: [A-F]" → set correct answer
   - Detect "Giải thích:" → add explanation
5. Validate questions (min 2 options, has correct answer)
6. Return JSON array
```

## 📊 Giới Hạn

- **File size**: Tối đa 10MB
- **Format**: Chỉ .doc và .docx
- **Số câu hỏi**: Không giới hạn
- **Số đáp án**: 2-6 đáp án/câu
- **Encoding**: UTF-8 (hỗ trợ tiếng Việt)

## 💡 Tips & Tricks

### 1. Tạo File Hiệu Quả
- Dùng file template có sẵn
- Copy/paste format cho nhiều câu
- Kiểm tra kỹ số thứ tự câu hỏi

### 2. Tránh Lỗi
- Không dùng bảng (table) trong Word
- Không chèn hình ảnh
- Chỉ dùng text thuần
- Đảm bảo không có ký tự đặc biệt

### 3. Tối Ưu
- Nhóm câu hỏi theo chủ đề
- Dùng "Find & Replace" trong Word để format hàng loạt
- Lưu file template riêng cho từng môn học

### 4. Debug
- Nếu parse lỗi, tải file mẫu
- So sánh format của bạn với mẫu
- Copy từng câu hỏi vào file mới nếu cần

## 📝 File Mẫu

Click **"📥 Tải file mẫu"** trong giao diện Import để download file template có 5 câu hỏi mẫu với đầy đủ format.

## 🎯 Use Cases

### 1. Giáo Viên Bận Rộn
Có sẵn 50 câu hỏi trong Word → Import trong 2 phút

### 2. Ngân Hàng Câu Hỏi
Có bộ câu hỏi cũ → Format lại → Import và tái sử dụng

### 3. Chia Sẻ Giữa Giáo Viên
GV A tạo file → GV B import → Tiết kiệm thời gian

### 4. Tạo Quiz Nhanh
Cần quiz gấp → Soạn trong Word → Import ngay

## 🚀 Roadmap Tương Lai

- [ ] Import từ Excel
- [ ] Import từ PDF
- [ ] Export quiz ra Word
- [ ] AI tự động sinh câu hỏi
- [ ] Detect và gợi ý sửa lỗi format
- [ ] Hỗ trợ hình ảnh trong câu hỏi

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra format file theo hướng dẫn
2. Thử với file template trước
3. Xem phần "Lỗi Thường Gặp" ở trên
4. Liên hệ support nếu vẫn không được

---

**Version**: 1.0  
**Last Updated**: 16/01/2026  
**Maintained by**: Assignment Management System Team
