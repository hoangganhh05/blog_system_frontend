# 🌐 BlogViet — Nền Tảng Mạng Xã Hội & Chia Sẻ Nội Dung

<div align="center">

**BlogViet** là nền tảng mạng xã hội và chia sẻ nội dung hiện đại, được xây dựng hoàn toàn từ đầu với kiến trúc độc lập — không sao chép bất kỳ nền tảng nào. Giao diện tối giản, trực quan với chế độ **Sáng/Tối** linh hoạt, hệ thống logo tự thích ứng màu sắc, và trải nghiệm mượt mà trên mọi thiết bị.

[![Live Demo](https://img.shields.io/badge/🌍_Live_Demo-anhhoangg.id.vn-000000?style=for-the-badge)](https://anhhoangg.id.vn/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.7_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## 📑 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Tính Năng Cốt Lõi](#-tính-năng-cốt-lõi)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cài Đặt & Chạy Dự Án](#-cài-đặt--chạy-dự-án)
- [Biến Môi Trường](#-biến-môi-trường)
- [Triển Khai Production](#-triển-khai-production)
- [Quy Tắc Build & Deploy](#-quy-tắc-build--deploy)
- [Tác Giả](#-tác-giả)

---

## 🎯 Tổng Quan

BlogViet ra đời với sứ mệnh mang đến một không gian chia sẻ nội dung thuần Việt — nơi người dùng có thể sáng tạo bài viết, kết nối bạn bè, trò chuyện thời gian thực, thưởng thức âm nhạc và tương tác với trợ lý AI thông minh, tất cả trong một giao diện duy nhất.

### Điểm nổi bật

| | Đặc điểm | Mô tả |
|---|---|---|
| 🎨 | **Giao diện tối giản** | Layout 3 cột cuộn độc lập, responsive mượt mà từ Desktop đến Mobile |
| 🌓 | **Light/Dark Mode** | Chế độ sáng/tối linh hoạt: Bật thủ công, Tắt, hoặc Tự động theo hệ thống |
| 🔒 | **Bảo mật End-to-End** | Mã hóa AES-256 toàn bộ Request/Response qua Filter Layer |
| 🤖 | **Trợ lý AI Gemini** | Tích hợp Gemini 3.7 Flash — trợ lý AI thế hệ mới nhất hỗ trợ tương tác trực tiếp |
| 🎵 | **Phòng nhạc tích hợp** | Mini Player, danh sách phát tuần tự, hỗ trợ nhiều thể loại nhạc Việt |
| ⚡ | **Real-time** | Chat trực tiếp, thông báo, trạng thái "Đã xem" và số đếm tin nhắn chưa đọc |

---

## 🛠 Công Nghệ Sử Dụng

### Backend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Spring Boot** | 4.1.0 | Framework ứng dụng chính |
| **Java** | 21 (LTS) | Ngôn ngữ lập trình |
| **Spring Data JPA** | — | ORM & truy vấn dữ liệu |
| **Spring Security** | — | Xác thực JWT & phân quyền |
| **Spring WebSocket** | — | Giao tiếp thời gian thực |
| **PostgreSQL** | — | Cơ sở dữ liệu quan hệ (Production) |
| **Lombok** | — | Giảm boilerplate code |
| **Gemini API** | 3.7 Flash | Trợ lý AI thông minh |
| **AES-256 Filter** | — | Mã hóa End-to-End Request/Response |

### Frontend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **React** | 19.2 | Thư viện UI chính |
| **Vite** | 8.2 | Build tool & Dev server |
| **Tailwind CSS** | 4.3 | Styling framework |
| **Axios** | 1.19 | HTTP Client cho API |
| **Lucide React** | 1.31 | Icon system |
| **React Router** | 7.18 | Điều hướng SPA |
| **Sonner** | 2.0 | Toast notifications |

### DevOps & Triển Khai

| Công nghệ | Vai trò |
|---|---|
| **Docker** | Containerization (Nginx + Node.js Alpine) |
| **Nginx** | Reverse Proxy & Static file serving |
| **Vercel / Netlify** | Frontend hosting |

---

## ✨ Tính Năng Cốt Lõi

### 📝 Nền Tảng Nội Dung

- **Đăng bài viết** với tiêu đề, ảnh bìa, chủ đề hashtag và trình soạn nội dung
- **Thả cảm xúc** đa dạng (Thích, Yêu thích, Haha, Wow, Buồn, Phẫn nộ) với bảng phân loại chi tiết
- **Bình luận** kèm hỗ trợ gửi GIF động sống động
- **Chia sẻ** bài viết: Quote kèm suy nghĩ cá nhân, gửi qua tin nhắn, hoặc sao chép liên kết
- **Lưu bài** (Bookmark) để đọc lại sau
- **Tóm tắt AI** — nút ✨ tự động tóm tắt ý chính bài viết dài

### 💬 Mạng Xã Hội Thời Gian Thực

- **Chat trực tiếp** (Real-time) với bạn bè qua WebSocket
- **Gọi thoại & Video HD** tích hợp sẵn
- **Tin nhắn thoại** (Voice note) — ghi âm và gửi trực tiếp
- **Gửi hình ảnh & GIF động** trong cuộc trò chuyện
- **Số đếm tin nhắn chưa đọc** (Unread badge) trên icon chat
- **Trạng thái "Đã xem"** (Read receipt) cho từng tin nhắn
- **Kết bạn & Theo dõi** — hệ thống quan hệ xã hội đầy đủ
- **Story 24h** — đăng tin tạm thời với kho lưu trữ riêng

### 🤖 Trợ Lý AI Tích Hợp (Gemini 3.7 Flash)

- **Trò chuyện trực tiếp** với AI qua popup modal hoặc chat widget
- **Gợi ý ý tưởng** viết bài, sáng tác thơ, tóm tắt nội dung
- **Thời gian thực** — System Prompt được truyền động mốc thời gian hiện tại
- **Fallback thông minh** — tự động chuyển đổi model nếu endpoint chính gặp sự cố (3.7 → 3.6 → 2.5 → 2.0)

### 🎵 Phòng Nhạc & Radio

- **Mini Music Player** tích hợp trên sidebar — nghe nhạc ngay khi lướt web
- **Sidebar Player** toàn màn hình với visual đẹp mắt
- **Danh sách phát tuần tự** (Queue/Auto-next) — chuyển bài tự động
- **Tùy chọn ẩn/hiện player** — không làm phiền khi không cần
- **Đa thể loại** — Pop Ballad, Vinahouse, Nhạc Trẻ, Lofi
- **Phòng nhạc & Radio** trên Mobile qua Burger Menu

### 🖥 Giao Diện & Trải Nghiệm

- **Layout 3 cột** cuộn độc lập trên Desktop — mỗi cột hoạt động riêng biệt
- **Responsive hoàn chỉnh** — tối ưu cho Mobile với Menu 3 gạch (Burger Menu)
- **Light/Dark Mode** — 3 chế độ: Sáng, Tối, Tự động theo hệ thống
- **Chế độ thu gọn giao diện** (Compact mode)
- **Lightbox xem ảnh** — nhấp vào ảnh đại diện/ảnh bìa để phóng to sắc nét
- **Logo tự thích ứng** — hệ thống logo chuyển đổi màu sắc theo theme

---

## 🏗 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                       │
│  React 19 + Vite 8 + Tailwind CSS 4 + Axios Client     │
│  (SPA — Vercel / Netlify / Nginx)                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
                       │ AES-256 Encrypted Request/Response
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                     │
│  Spring Boot 4.1 — Controller → Service → Repository    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ JWT Auth    │  │ AES-256      │  │ CORS Filter    │ │
│  │ Filter      │  │ Crypto       │  │ Config         │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────┬──────────────┬───────────────┬───────────────┘
           │              │               │
           ▼              ▼               ▼
┌────────────────┐ ┌─────────────┐ ┌──────────────────┐
│  PostgreSQL    │ │  WebSocket  │ │  Gemini AI API   │
│  Database      │ │  Real-time  │ │  (3.7 Flash)     │
└────────────────┘ └─────────────┘ └──────────────────┘
```

---

## 🚀 Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống

| Yêu cầu | Phiên bản tối thiểu |
|---|---|
| Java JDK | 21+ |
| Node.js | 20+ |
| Maven | 3.9+ (hoặc dùng Maven Wrapper `mvnw`) |
| PostgreSQL | 15+ |
| Git | 2.40+ |

### 1. Clone Repository

```bash
# Frontend
git clone https://github.com/hoangganhh05/blog_system_frontend.git
cd blog_system_frontend

# Backend
git clone https://github.com/hoangganhh05/blog_system_backend.git
cd blog_system_backend
```

### 2. Cấu Hình Backend

```bash
cd blog_system_backend

# Tạo file biến môi trường (hoặc cấu hình trực tiếp trong application.properties)
# Xem mục "Biến Môi Trường" bên dưới để biết các biến cần thiết

# Biên dịch dự án (kiểm tra lỗi)
./mvnw clean compile -Dmaven.test.skip=true

# Chạy ứng dụng
./mvnw spring-boot:run
```

> Mặc định backend chạy tại: `http://localhost:8080`

### 3. Cấu Hình Frontend

```bash
cd blog_system_frontend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env

# Chạy môi trường phát triển
npm run dev

# Hoặc build production bundle
npm run build
```

> Mặc định frontend dev server chạy tại: `http://localhost:5173`

---

## 🔐 Biến Môi Trường

### Backend (`application.properties` / Environment Variables)

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `DB_URL` | JDBC URL kết nối PostgreSQL | ✅ |
| `DB_USER` | Username database | ✅ |
| `DB_PASSWORD` | Password database | ✅ |
| `JWT_SECRET` | Secret key cho JWT Authentication | ✅ |
| `GEMINI_API_KEY` | API Key của Google Gemini AI | ✅ |
| `GEMINI_MODEL` | Tên model Gemini (mặc định: `gemini-3.7-flash`) | ❌ |
| `PORT` | Port server (mặc định: `8080`) | ❌ |
| `CORS_ALLOWED_ORIGINS` | Danh sách domain được phép gọi API | ❌ |

### Frontend (`.env`)

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `VITE_API_URL` | Base URL cho API (mặc định: `/api`) | ✅ |

---

## 🐳 Triển Khai Production

### Docker (Frontend)

```bash
# Build Docker image
docker build -t blogviet-frontend .

# Chạy container
docker run -d -p 80:80 blogviet-frontend
```

### Docker Compose (Full Stack)

```bash
docker-compose up -d
```

### Vercel / Netlify (Frontend)

Dự án đã được cấu hình sẵn cho cả Vercel (`vercel.json`) và Netlify (`netlify.toml`):

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Framework:** Vite

---

## 📋 Quy Tắc Build & Deploy

> **⚠️ BẮT BUỘC:** Mọi thay đổi code PHẢI vượt qua kiểm tra build trên local với **0 errors** trước khi commit và push lên GitHub.

### Checklist trước khi Push

```bash
# 1. Backend — Biên dịch kiểm tra (0 errors)
cd blog_system_backend
./mvnw clean compile -Dmaven.test.skip=true
# ✅ Kết quả mong đợi: BUILD SUCCESS

# 2. Frontend — Build production (0 errors)
cd blog_system_frontend
npm run build
# ✅ Kết quả mong đợi: ✓ built in Xs

# 3. Commit & Push
git add .
git commit -m "feat/fix/refactor: mô tả ngắn gọn thay đổi"
git push origin main
```

### Quy Ước Commit Message

| Prefix | Sử dụng khi |
|---|---|
| `feat:` | Thêm tính năng mới |
| `fix:` | Sửa lỗi |
| `upgrade:` | Nâng cấp dependency hoặc model |
| `refactor:` | Tái cấu trúc code (không thay đổi hành vi) |
| `docs:` | Cập nhật tài liệu |
| `style:` | Thay đổi giao diện / CSS |

---

## 👤 Tác Giả

**Hoàng Anh** — Full-stack Developer

- 🌐 Website: [anhhoangg.id.vn](https://anhhoangg.id.vn/)
- 💻 GitHub: [@hoangganhh05](https://github.com/hoangganhh05)

---

<div align="center">

Được xây dựng với ❤️ bằng **Spring Boot**, **React** và **Gemini AI**

</div>
