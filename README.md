# 🌐 BlogViet — Nền Tảng Mạng Xã Hội & Sáng Tạo Nội Dung Trực Tuyến

<div align="center">

**BlogViet** là nền tảng mạng xã hội và sáng tạo nội dung trực tuyến thế hệ mới, được kiến trúc và phát triển độc lập từ đầu (End-to-End). Dự án kết hợp sức mạnh xử lý của **Spring Boot 4 / Java 21**, giao diện người dùng siêu mượt mà của **React 19 / Vite 8 / Tailwind CSS 4**, cùng hệ thống **Trợ lý Trí tuệ Nhân tạo Gemini AI 3.7 Flash** và giao thức truyền thông thời gian thực **WebSocket & WebRTC**.

[![Live Demo](https://img.shields.io/badge/🌍_Live_Demo-anhhoangg.id.vn-0866ff?style=for-the-badge&logo=googlechrome&logoColor=white)](https://anhhoangg.id.vn/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Java](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.7_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📑 Mục Lục

- [🎯 Điểm Nổi Bật & Triết Lý Thiết Kế](#-điểm-nổi-bật--triết-lý-thiết-kế)
- [✨ Hệ Thống Tính Năng Toàn Diện](#-hệ-thống-tính-năng-toàn-diện)
  - [1. Mạng Xã Hội & Sáng Tạo Bài Viết](#1-mạng-xã-hội--sáng-tạo-bài-viết)
  - [2. Tin 24h (Stories) Đa Nền Tảng & Đồng Bộ Real-time](#2-tin-24h-stories-đa-nền-tảng--đồng-bộ-real-time)
  - [3. Messenger Thời Gian Thực & WebRTC HD Call](#3-messenger-thời-gian-thực--webrtc-hd-call)
  - [4. Bảo Mật Quyền Riêng Tư Trạng Thái Hoạt Động](#4-bảo-mật-quyền-riêng-tư-trạng-thái-hoạt-động)
  - [5. Trợ Lý AI Thông Minh (Gemini 3.7 Flash)](#5-trợ-lý-ai-thông-minh-gemini-37-flash)
  - [6. Phòng Nhạc Studio & Mini Player](#6-phòng-nhạc-studio--mini-player)
  - [7. Tối Ưu Hóa Giao Diện Mobile & Desktop (UX/UI)](#7-tối-ưu-hóa-giao-diện-mobile--desktop-uxui)
- [🛠 Công Nghệ & Kiến Trúc Kỹ Thuật](#-công-nghệ--kiến-trúc-kỹ-thuật)
- [📁 Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
- [🚀 Hướng Dẫn Cài Đặt & Chạy Local](#-hướng-dẫn-cài-đặt--chạy-local)
- [🔐 Biến Môi Trường (Environment Variables)](#-biến-môi-trường-environment-variables)
- [🐳 Triển Khai Production & Docker](#-triển-khai-production--docker)
- [📋 Quy Chuẩn Build & Commit Code](#-quy-chuẩn-build--commit-code)
- [👤 Tác Giả](#-tác-giả)

---

## 🎯 Điểm Nổi Bật & Triết Lý Thiết Kế

| Đặc điểm | Chi tiết triển khai |
|---|---|
| 🎨 **Thiết kế Tinh Giản & Cao Cấp** | Loại bỏ hoàn toàn các khung nền thô xám, card nổi đa tầng mượt mà, hỗ trợ **Light/Dark Mode** tự thích ứng theo hệ thống. |
| ⚡ **Hiệu Năng & Tối Ưu Render** | Vite 8 + Tailwind CSS 4 với cơ chế Hardware Accelerated Rendering (`image-rendering: -webkit-optimize-contrast`, `translateZ(0)`). |
| 🔒 **Bảo Mật Quyền Riêng Tư Đa Tầng** | Kiểm soát trạng thái hoạt động theo ngữ cảnh (chỉ người đã nhắn tin mới thấy online), mã hóa Request/Response End-to-End. |
| 🔄 **Đồng Bộ Dữ Liệu Tức Thì** | Sử dụng `BroadcastChannel` kết hợp `WebSocket (STOMP)` đồng bộ đa tab, đa thiết bị không cần F5. |
| 🤖 **AI Assistant Thế Hệ Mới** | Tích hợp Google Gemini 3.7 Flash hỗ trợ viết bài, tóm tắt nội dung, giải đáp thắc mắc và tạo cảm hứng sáng tạo. |

---

## ✨ Hệ Thống Tính Năng Toàn Diện

### 1. Mạng Xã Hội & Sáng Tạo Bài Viết
- **Khung Đăng Bài (QuickComposer):** Bố cục 2 nhóm tinh giản — nhóm bên trái chọn ảnh, chủ đề, quyền riêng tư; nhóm bên phải là nút "Đăng bài" trực quan với 2 trạng thái Active/Inactive rõ rệt.
- **Trình soạn thảo bài viết:** Hỗ trợ văn bản phong phú, tải nhiều ảnh phân bổ lưới (Grid) 1-4 ảnh thông minh, gắn thẻ chủ đề (Tags/Categories).
- **Hệ thống Cảm xúc Đa Dạng (Reactions):** Thả tim, Thích, Haha, Wow, Buồn, Phẫn nộ với danh sách thống kê người tương tác chi tiết.
- **Bình luận & Phản hồi đa tầng:** Hỗ trợ bình luận văn bản và kho ảnh động GIF sinh động.
- **Chia sẻ & Lưu trữ (Bookmarks):** Trích dẫn bài viết (Quote Post), chia sẻ trực tiếp vào box chat bạn bè, hoặc lưu vào kho cá nhân.

### 2. Tin 24h (Stories) Đa Nền Tảng & Đồng Bộ Real-time
- **Tạo tin linh hoạt:** Đăng tin ảnh kèm hiệu ứng chữ hoặc tạo tin chữ trên nền Gradient nghệ thuật.
- **Đồng bộ hóa 2 chiều:** Đăng tin ở Trang chủ thì thanh Story trong Messenger lập tức cập nhật thông qua `useStories` và `BroadcastChannel`.
- **Trình chiếu Tin (Story Viewer Responsive):**
  - **Trên Mobile:** Trải nghiệm toàn màn hình tràn viền (`Fullscreen Modal`) chuẩn Instagram/Facebook.
  - **Trên Máy tính (PC):** Giao diện khung chiếu nổi bật ở trung tâm màn hình, có thanh thời lượng chạy tự động 5s, nút thả tim và ô gửi phản hồi trực tiếp vào tin nhắn.
- **Hiển thị tinh gọn:** Thanh tin trong Messenger chỉ hiển thị tin của bạn bè, loại bỏ mục "Tin của bạn" để tập trung tối đa cho việc giao tiếp.

### 3. Messenger Thời Gian Thực & WebRTC HD Call
- **Chat Real-time:** Nhắn tin tức thì với bạn bè qua WebSocket, hiển thị trạng thái "Đang gõ...", "Đã gửi" và "Đã xem" (Read Receipts).
- **Cuộc gọi Thoại & Video HD:** Tích hợp công nghệ truyền thông WebRTC Peer-to-Peer trực tiếp trên trình duyệt.
- **Tin nhắn thoại (Voice Notes):** Ghi âm trực tiếp và phát lại với thanh sóng âm trực quan.
- **Hộp thư nổi (Floating Chat Widget):** Thu gọn/mở rộng linh hoạt, quản lý nhiều cuộc trò chuyện cùng lúc mà không gián đoạn việc lướt web.

### 4. Bảo Mật Quyền Riêng Tư Trạng Thái Hoạt Động
- **Nguyên tắc cốt lõi:** Người lạ hoàn toàn không thể xem trạng thái trực tuyến/ngoại tuyến của bạn ở bất kỳ đâu (Tab Gợi ý kết bạn, Sidebar, Tìm kiếm).
- **Kiểm tra thông minh:** Chỉ khi hai người dùng **đã từng có lịch sử gửi tin nhắn cho nhau**, trạng thái Online và thời gian hoạt động mới được giải mã hiển thị theo cấu hình riêng tư của người dùng.

### 5. Trợ Lý AI Thông Minh (Gemini 3.7 Flash)
- **Trợ lý AI BlogViet:** Tích hợp sẵn trên thanh Header và Chat Widget để đồng hành cùng người dùng 24/7.
- **Tính năng AI nổi bật:**
  - ✨ **Tóm tắt bài viết dài:** Nắm bắt nhanh nội dung bài viết chỉ trong 3 giây.
  - ✍️ **Hỗ trợ viết & sửa bài:** Gợi ý tiêu đề cuốn hút, hoàn thiện dàn ý và chau chuốt từ ngữ.
  - 💡 **Sáng tạo nội dung:** Hỏi đáp kiến thức lập trình, văn hóa, đời sống với ngữ cảnh thời gian thực chính xác.

### 6. Phòng Nhạc Studio & Mini Player
- **Trình phát nhạc Mini:** Tích hợp cố định góc màn hình hoặc sidebar, phát nhạc nền êm dịu khi đọc bài viết.
- **Danh sách phát tự động (Auto-next):** Kho nhạc phong phú nhiều thể loại (Acoustic, Lofi, Pop Ballad, EDM).
- **Điều khiển tiện lợi:** Tùy chỉnh âm lượng, tua bài, chuyển đổi chế độ thu gọn hoặc mở toàn màn hình.

### 7. Tối Ưu Hóa Giao Diện Mobile & Desktop (UX/UI)
- **Bottom Navigation Mobile:** Thanh điều hướng 4 nút chuẩn ngón tay cái (*Trang chủ, Khám phá, Tạo bài, Thông báo*).
- **Menu 3 gạch (`☰`) Tập trung:** Đưa toàn bộ lối tắt quản lý tài khoản, Hồ sơ, Cài đặt, Chế độ sáng/tối vào một ngăn kéo trượt mượt mà.
- **Trang Cài đặt độc lập (`/settings`):** Khu vực quản lý tập trung: Cài đặt tài khoản, Bảo mật & Quyền riêng tư, Công tắc Trạng thái hoạt động.
- **Trang Bạn bè & Kết nối (`/friends`):** Cấu trúc tiêu đề nổi độc lập bên ngoài thẻ danh sách, phân tab trực quan (*Bạn bè, Lời mời kết bạn, Gợi ý*).

---

## 🛠 Công Nghệ & Kiến Trúc Kỹ Thuật

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATION                     │
│  React 19.2 • Vite 8.2 • Tailwind CSS 4 • React Router 7    │
│  (SPA — Responsive Desktop / Tablet / Mobile)               │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / RESTful API (JSON)
                               │ WebSocket (STOMP Protocol)
                               │ WebRTC (Media Stream P2P)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND MICROSERVICES                   │
│  Spring Boot 4.1 • Spring Security • Spring Data JPA        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ JWT Auth Filter  │  │ Privacy Guardian │  │ WebSocket  │ │
│  │ (Role & Token)   │  │ (Message History)│  │ Broker     │ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
└──────────────┬──────────────────┬─────────────────┬─────────┘
               │                  │                 │
               ▼                  ▼                 ▼
     ┌──────────────────┐ ┌───────────────┐ ┌───────────────┐
     │    PostgreSQL    │ │ Cloudinary /  │ │ Google Gemini │
     │  Database (RDBMS)│ │ Local Storage │ │   3.7 Flash   │
     └──────────────────┘ └───────────────┘ └───────────────┘
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
blog_system_frontend/
├── public/                 # Favicon, Assets tĩnh, Âm thanh thông báo
├── src/
│   ├── assets/             # Hình ảnh logo, icons minh họa
│   ├── components/         # Các UI component tái sử dụng
│   │   ├── Avatar.jsx          # Component ảnh đại diện kèm chấm trạng thái
│   │   ├── FloatingChatWidget.jsx # Hộp thư nổi Messenger & WebRTC Call
│   │   ├── StoryBar.jsx        # Thanh Tin 24h dạng card phong cách Instagram
│   │   ├── StoryViewerModal.jsx # Trình chiếu Story toàn màn hình / Modal
│   │   ├── QuickComposer.jsx   # Khung đăng bài viết tinh chỉnh hiện đại
│   │   ├── PostCard.jsx        # Thẻ bài viết với Reaction & Comment
│   │   └── MobileNavDrawer.jsx # Ngăn kéo điều hướng Menu 3 gạch trên mobile
│   ├── context/            # React Context (AuthContext, ThemeContext, SocketContext)
│   ├── hooks/              # Custom Hooks (useStories, useChat, useTheme)
│   ├── layouts/            # MainLayout (Header, Sidebar, BottomNav)
│   ├── pages/              # Các trang chính
│   │   ├── Home.jsx            # Bảng tin trang chủ
│   │   ├── Profile.jsx         # Trang cá nhân người dùng
│   │   ├── FriendsPage.jsx     # Trang Bạn bè & Kết nối
│   │   ├── SettingsPage.jsx    # Trang Cài đặt & Quyền riêng tư độc lập
│   │   ├── TrendingPage.jsx    # Trang Khám phá & Thịnh hành
│   │   └── SearchPage.jsx      # Trang Tìm kiếm thông minh
│   ├── services/           # Axios Client gọi API Backend (api.js, chatService, etc.)
│   ├── utils/              # Tiện ích hỗ trợ (statusUtils, formatters)
│   ├── App.jsx             # Định tuyến SPA Routes
│   ├── index.css           # Cấu hình Tailwind CSS 4 & Tối ưu GPU Image Rendering
│   └── main.jsx            # Entry point ứng dụng
├── package.json            # Danh sách dependencies & Scripts
└── vite.config.js          # Cấu hình Vite Dev Server & Build Output
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### Yêu Cầu Môi Trường
- **Node.js:** `>= 20.0.0`
- **Java JDK:** `>= 21.0.0` (Khuyên dùng OpenJDK hoặc Oracle JDK 21)
- **Maven:** `>= 3.9.0` (hoặc sử dụng sẵn script `./mvnw`)
- **PostgreSQL:** `>= 15.0`

---

### 1. Khởi Chạy Backend (Spring Boot)

```bash
# Di chuyển vào thư mục backend
cd "e:/JAVA_INTERN/Blog System"

# Kiểm tra biên dịch mã nguồn
./mvnw clean compile -Dmaven.test.skip=true

# Khởi chạy server Backend
./mvnw spring-boot:run
```
> Server Backend mặc định lắng nghe tại: `http://localhost:8080`

---

### 2. Khởi Chạy Frontend (React + Vite)

```bash
# Di chuyển vào thư mục frontend
cd "e:/JAVA_INTERN/blog_system_frontend"

# Cài đặt gói thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
> Ứng dụng Frontend sẵn sàng truy cập tại: `http://localhost:5173`

---

## 🔐 Biến Môi Trường (Environment Variables)

### Backend (`application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/blog_system
spring.datasource.username=postgres
spring.datasource.password=your_password
jwt.secret=your_super_secret_jwt_key_here
gemini.api.key=your_google_gemini_api_key_here
gemini.model=gemini-3.7-flash
server.port=8080
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

---

## 🐳 Triển Khai Production & Docker

### Build Docker Container cho Frontend
```bash
docker build -t blogviet-frontend:latest .
docker run -d -p 80:80 --name blogviet-fe blogviet-frontend:latest
```

---

## 📋 Quy Chuẩn Build & Commit Code

> **⚠️ QUY TẮC BẮT BUỘC:** Trước khi commit và push lên GitHub, BẮT BUỘC phải chạy lệnh build test trên local đảm bảo **0 lỗi (0 errors)**:

```bash
# 1. Kiểm tra Backend
cd "Blog System"
./mvnw clean compile -Dmaven.test.skip=true
# Kết quả yêu cầu: [INFO] BUILD SUCCESS

# 2. Kiểm tra Frontend
cd "blog_system_frontend"
npm run build
# Kết quả yêu cầu: ✓ built in Xs (0 errors)

# 3. Commit & Push
git add .
git commit -m "loại_thay_đổi(phạm_vi): mô tả rõ ràng nội dung cập nhật"
git push origin main
```

---

## 👤 Tác Giả

**Hoàng Anh** — *Full-stack Software Engineer*

- 🌐 Website / Portfolio: [anhhoangg.id.vn](https://anhhoangg.id.vn/)
- 💻 GitHub: [@hoangganhh05](https://github.com/hoangganhh05)
- 📧 Email: `hoanganh.dev@gmail.com`

---

<div align="center">

Dự án được xây dựng và phát triển với trọn vẹn tâm huyết ❤️ bằng **Spring Boot**, **React** và **Gemini AI**.

</div>
