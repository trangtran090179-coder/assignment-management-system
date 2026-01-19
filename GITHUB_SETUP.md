# 🚀 Hướng Dẫn Push Code Lên GitHub

## Bước 1: Tạo Repository Trên GitHub

1. Truy cập [github.com](https://github.com) và đăng nhập
2. Click nút **"+"** ở góc trên bên phải → chọn **"New repository"**
3. Điền thông tin:
   - **Repository name**: `assignment-management-system` (hoặc tên bạn muốn)
   - **Description**: `Full-stack Assignment Management System with React & Node.js`
   - **Visibility**: Chọn **Public** hoặc **Private**
   - **⚠️ KHÔNG** tick vào "Add a README file"
   - **⚠️ KHÔNG** chọn .gitignore hoặc license (đã có sẵn)
4. Click **"Create repository"**

## Bước 2: Copy URL Repository

Sau khi tạo xong, bạn sẽ thấy URL như:
```
https://github.com/username/assignment-management-system.git
```

Copy URL này!

## Bước 3: Push Code Lên GitHub

Mở PowerShell hoặc Terminal trong VS Code và chạy các lệnh sau:

### Option 1: HTTPS (Khuyến nghị cho người mới)

```powershell
cd "c:\Users\Administrator\Downloads\assignment-management-system\my-web-app"

# Thay YOUR_USERNAME và YOUR_REPO bằng thông tin thực của bạn
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Đổi tên branch từ master sang main (GitHub mặc định dùng main)
git branch -M main

# Push code lên GitHub
git push -u origin main
```

### Option 2: SSH (Nếu đã setup SSH key)

```powershell
cd "c:\Users\Administrator\Downloads\assignment-management-system\my-web-app"

git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Bước 4: Nhập Thông Tin Đăng Nhập

- Nếu dùng HTTPS, GitHub sẽ yêu cầu đăng nhập:
  - **Username**: Tên đăng nhập GitHub của bạn
  - **Password**: **KHÔNG** dùng mật khẩu thường!
  - **Personal Access Token (PAT)**: Cần tạo token

### Cách Tạo Personal Access Token:

1. Vào GitHub → Click avatar → **Settings**
2. Sidebar bên trái → **Developer settings** (ở cuối)
3. **Personal access tokens** → **Tokens (classic)**
4. Click **"Generate new token"** → **"Generate new token (classic)"**
5. Điền thông tin:
   - **Note**: `My Web App Deployment`
   - **Expiration**: Chọn `90 days` hoặc `No expiration`
   - **Scopes**: Tick vào `repo` (tất cả)
6. Click **"Generate token"**
7. **⚠️ QUAN TRỌNG**: Copy token ngay! Bạn sẽ không thấy lại nữa!
8. Dùng token này làm password khi push code

## ✅ Kiểm Tra

Sau khi push thành công:
1. Truy cập repository trên GitHub
2. Refresh trang, bạn sẽ thấy tất cả code đã được upload
3. Check các file: `README.md`, `DEPLOYMENT.md`, folders `client/`, `server/`

## 🔄 Cập Nhật Code Sau Này

Mỗi khi có thay đổi:

```powershell
cd "c:\Users\Administrator\Downloads\assignment-management-system\my-web-app"

# Xem files thay đổi
git status

# Thêm tất cả files thay đổi
git add .

# Commit với message mô tả
git commit -m "Update: mô tả thay đổi"

# Push lên GitHub
git push
```

## 🚨 Troubleshooting

### Lỗi: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Lỗi: "Authentication failed"
- Đảm bảo dùng Personal Access Token, không phải password
- Tạo token mới nếu token cũ hết hạn

### Lỗi: "Permission denied"
- Kiểm tra bạn có quyền push vào repository không
- Đảm bảo repository URL đúng

### Muốn đổi repository URL:
```powershell
git remote set-url origin https://github.com/NEW_USERNAME/NEW_REPO.git
```

## 📝 Lưu Ý Quan Trọng

1. **KHÔNG** commit file `.env` có thông tin nhạy cảm (đã có trong .gitignore)
2. **ĐÃ COMMIT**: `.env.example` (template không có thông tin thật)
3. Sau khi push lên GitHub, bạn có thể deploy trên Vercel/Render như hướng dẫn trong `DEPLOYMENT.md`

## 🎯 Tiếp Theo

Sau khi push code lên GitHub:
1. Đọc [DEPLOYMENT.md](DEPLOYMENT.md) để deploy ứng dụng
2. Setup CI/CD để tự động deploy khi có thay đổi
3. Mời collaborators vào project (nếu làm nhóm)

---

🎉 **Xong rồi! Code của bạn đã an toàn trên GitHub!**
