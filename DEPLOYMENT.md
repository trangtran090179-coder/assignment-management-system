# Hướng Dẫn Deployment

## 📋 Tổng Quan
Ứng dụng này gồm 2 phần:
- **Frontend (Client)**: React app - Deploy lên Vercel
- **Backend (Server)**: Node.js/Express - Deploy lên Render

## 🚀 Bước 1: Deploy Backend lên Render

### 1.1. Tạo tài khoản Render
1. Truy cập [render.com](https://render.com)
2. Đăng ký tài khoản (có thể dùng GitHub)

### 1.2. Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect repository của bạn hoặc chọn "Public Git repository"
3. Điền thông tin:
   - **Name**: `assignment-management-backend`
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Branch**: `main` hoặc `master`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js` hoặc `npm start`
   - **Instance Type**: `Free`

4. Thêm Environment Variables:
   - Click **"Advanced"** → **"Add Environment Variable"**
   - Thêm các biến:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     ```

5. Click **"Create Web Service"**
6. Đợi 5-10 phút để deploy
7. Copy URL backend (ví dụ: `https://assignment-management-backend.onrender.com`)

## 🌐 Bước 2: Deploy Frontend lên Vercel

### 2.1. Tạo tài khoản Vercel
1. Truy cập [vercel.com](https://vercel.com)
2. Đăng ký bằng GitHub

### 2.2. Cập nhật API URL
1. Mở file `client/.env.production`
2. Thay `your-backend-url.onrender.com` bằng URL backend từ Render:
   ```
   REACT_APP_API_URL=https://assignment-management-backend.onrender.com/api
   ```

### 2.3. Deploy Frontend
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Trong thư mục `client`, chạy:
   ```bash
   cd client
   vercel login
   vercel
   ```

3. Hoặc deploy qua Vercel Dashboard:
   - Click **"Add New..."** → **"Project"**
   - Import repository
   - **Root Directory**: chọn `client`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - Thêm Environment Variable:
     ```
     REACT_APP_API_URL=https://assignment-management-backend.onrender.com/api
     ```
   - Click **"Deploy"**

4. Copy URL frontend (ví dụ: `https://your-app.vercel.app`)

## 🔧 Bước 3: Cập Nhật CORS

1. Quay lại Render dashboard
2. Vào backend service → **Environment**
3. Thêm biến:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
4. Cập nhật file `server/src/server.ts` để sử dụng biến này:
   ```typescript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || '*'
   }));
   ```

## ✅ Kiểm Tra

1. Truy cập URL frontend từ Vercel
2. Kiểm tra xem có kết nối được với backend không
3. Test các chức năng chính

## 🔄 Cập Nhật Sau Này

### Cập nhật Frontend:
```bash
cd client
git add .
git commit -m "update"
git push
```
Vercel sẽ tự động deploy lại.

### Cập nhật Backend:
```bash
cd server
git add .
git commit -m "update"
git push
```
Render sẽ tự động deploy lại.

## 💡 Lưu Ý

1. **Free tier của Render**: Server sẽ sleep sau 15 phút không hoạt động. Request đầu tiên sẽ mất ~30s để wake up.
2. **MongoDB**: Đảm bảo whitelist IP `0.0.0.0/0` trong MongoDB Atlas để Render có thể kết nối.
3. **Environment Variables**: Không commit file `.env` lên Git!
4. **Build time**: Frontend build ~2-3 phút, Backend ~3-5 phút.

## 🆘 Troubleshooting

### Backend không start:
- Kiểm tra logs trong Render dashboard
- Đảm bảo MongoDB connection string đúng
- Check Environment Variables

### Frontend không gọi được API:
- Kiểm tra `REACT_APP_API_URL` trong Vercel
- Check CORS settings ở backend
- Mở Developer Console để xem errors

### 500 Error:
- Check server logs trong Render
- Kiểm tra MongoDB connection
- Verify tất cả dependencies đã được install

## 📱 Alternative: Deploy Cả Hai Lên Render

Nếu muốn deploy cả frontend lẫn backend lên Render:

1. Deploy backend như hướng dẫn trên
2. Deploy frontend:
   - **Type**: Static Site
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`
   - Add Environment Variable: `REACT_APP_API_URL`

## 🎉 Hoàn Tất!

Ứng dụng của bạn đã được deploy thành công!

- Frontend: https://your-app.vercel.app
- Backend: https://assignment-management-backend.onrender.com
