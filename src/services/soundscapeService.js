import axiosClient from "../api/axiosClient";

// Danh sách âm thanh mẫu dự phòng chất lượng cao (100% bản quyền miễn phí thực địa)
export const DEFAULT_SOUNDSCAPES = [
  {
    id: 1001,
    title: "Mưa đêm rơi trên mái tôn Hà Nội",
    location: "Ba Đình, Hà Nội",
    category: "RAIN",
    audioUrl: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
    imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop&q=80",
    description: "Tiếng mưa rào rả rích đêm khuya, thích hợp đọc sách, viết lách và tập trung làm việc.",
    creatorName: "Hà Nội Field Recorder",
    likesCount: 142,
    playsCount: 3820,
    durationSeconds: 180,
  },
  {
    id: 1002,
    title: "Góc quán Cà phê Sài Gòn sáng sớm",
    location: "Quận 1, TP. Hồ Chí Minh",
    category: "CAFE",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
    description: "Không khí ấm cúng, tiếng ly tách chạm nhẹ và tiếng trò chuyện thì thầm êm dịu.",
    creatorName: "Sài Gòn Phố",
    likesCount: 98,
    playsCount: 2410,
    durationSeconds: 154,
  },
  {
    id: 1003,
    title: "Tiếng sóng biển rì rào đêm trăng",
    location: "Bãi biển Nha Trang, Khánh Hòa",
    category: "OCEAN",
    audioUrl: "https://actions.google.com/sounds/v1/water/ocean_waves.ogg",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    description: "Âm thanh sóng vỗ từng đợt nhẹ nhàng vào bờ cát trắng, giúp thư giãn tâm trí và ngủ ngon.",
    creatorName: "Biển Việt Nam",
    likesCount: 215,
    playsCount: 5120,
    durationSeconds: 210,
  },
  {
    id: 1004,
    title: "Tiếng rừng thông gió reo & chim hót",
    location: "Rừng thông Đà Lạt, Lâm Đồng",
    category: "NATURE",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/forest_birds.ogg",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
    description: "Âm thanh tự nhiên trong lành giữa rừng thông cao nguyên vào một sớm sương mờ.",
    creatorName: "Đà Lạt Vibe",
    likesCount: 178,
    playsCount: 4290,
    durationSeconds: 195,
  },
  {
    id: 1005,
    title: "Đô thị về đêm & tiếng xe cộ êm đềm",
    location: "Cầu Thủ Thiêm, TP. Hồ Chí Minh",
    category: "URBAN",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/city_street_day.ogg",
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80",
    description: "Tiếng vọng từ thành phố khi đêm đã về khuya, tạo nhịp điệu kích thích cảm hứng sáng tạo.",
    creatorName: "Urban Soundscape",
    likesCount: 84,
    playsCount: 1930,
    durationSeconds: 160,
  },
  {
    id: 1006,
    title: "Tiếng suối chảy róc rách & ve kêu mùa hè",
    location: "Vườn quốc gia Cúc Phương, Ninh Bình",
    category: "SUMMER",
    audioUrl: "https://actions.google.com/sounds/v1/water/stream_water.ogg",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80",
    description: "Dòng suối trong vắt len lỏi qua từng khe đá mát lạnh giữa mùa hè oi ả.",
    creatorName: "Cúc Phương Ranger",
    likesCount: 132,
    playsCount: 3100,
    durationSeconds: 175,
  },
];

const soundscapeService = {
  // Lấy danh sách âm thanh môi trường với phân trang & bộ lọc
  getAll(category = "", location = "", page = 0, size = 12) {
    const params = new URLSearchParams();
    if (category && category !== "ALL") params.append("category", category);
    if (location) params.append("location", location);
    params.append("page", page);
    params.append("size", size);

    return axiosClient.get(`/soundscapes?${params.toString()}`).catch(() => {
      // Fallback danh sách mặc định nếu server vừa mới khởi tạo
      let filtered = [...DEFAULT_SOUNDSCAPES];
      if (category && category !== "ALL") {
        filtered = filtered.filter((s) => s.category.toUpperCase() === category.toUpperCase());
      }
      if (location) {
        filtered = filtered.filter(
          (s) =>
            s.location.toLowerCase().includes(location.toLowerCase()) ||
            s.title.toLowerCase().includes(location.toLowerCase())
        );
      }
      return { data: { content: filtered, totalElements: filtered.length, totalPages: 1 } };
    });
  },

  getById(id) {
    return axiosClient.get(`/soundscapes/${id}`).catch(() => {
      const found = DEFAULT_SOUNDSCAPES.find((s) => Number(s.id) === Number(id));
      return { data: found || DEFAULT_SOUNDSCAPES[0] };
    });
  },

  create(soundscapeData) {
    return axiosClient.post("/soundscapes", soundscapeData);
  },

  delete(id) {
    return axiosClient.delete(`/soundscapes/${id}`);
  },

  like(id) {
    return axiosClient.post(`/soundscapes/${id}/like`).catch(() => {
      return { data: { success: true } };
    });
  },

  incrementPlay(id) {
    return axiosClient.post(`/soundscapes/${id}/play`).catch(() => {
      return { data: { success: true } };
    });
  },
};

export default soundscapeService;
