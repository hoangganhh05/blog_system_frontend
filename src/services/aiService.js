/**
 * AI Assistant Service - Gọi trực tiếp Spring Boot Backend Proxy (Gemini 1.5 Flash bảo mật API Key)
 */
import axiosClient from "../api/axiosClient";

const SAMPLE_TEMPLATES = {
  du_lich: {
    titles: ["Hành trình khám phá vlogs và trải nghiệm tuyệt vời", "Kinh nghiệm du lịch tự túc từ A đến Z cho người mới"],
    content: "Chuyến đi này mang đến cho mình những trải nghiệm không thể nào quên. Nơi đây sở hữu cảnh sắc thiên nhiên hùng vĩ, khí hậu trong lành và ẩm thực vô cùng phong phú. Dưới đây là 3 điểm đến ấn tượng nhất mà bạn nhất định nên thử ghé qua 1 lần trong đời...",
    hashtags: "#DuLich #TraiNghiem #KhamPha #VietNam"
  },
  lap_trinh: {
    titles: ["Bí quyết trở thành Lập trình viên giỏi & Tối ưu tư duy Code", "Những sai lầm người mới học lập trình thường mắc phải"],
    content: "Học lập trình không chỉ là gõ từng dòng lệnh, mà quan trọng nhất là tư duy giải quyết vấn đề. Hãy tập trung nắm vững kiến thức cốt lõi, thường xuyên thực hành dự án thực tế và học cách đọc tài liệu chuẩn...",
    hashtags: "#LapTrinh #Developer #CodeLife #TechBlog"
  },
  doi_song: {
    titles: ["Cân bằng cuộc sống và công việc trong thế giới hiện đại", "Thói quen nhỏ giúp bạn tích cực và năng lượng hơn mỗi ngày"],
    content: "Mỗi ngày trôi qua đều là một cơ hội để chúng ta hoàn thiện bản thân hơn. Dành ra 15 phút buổi sáng để đọc sách, uống một ly nước ấm và lập danh sách công việc sẽ giúp bạn có một ngày làm việc hiệu quả và tràn đầy năng lượng...",
    hashtags: "#CuocSong #TichCuc #Motivation #HealthyLife"
  }
};

const POEMS_DATA = {
  "Tình Yêu": "Nắng nhẹ nhàng vương tóc em bay\nTình ta êm ả những tháng ngày\nTrao nhau ánh mắt đầy thương mến\nNguyện mãi bên nhau trọn kiếp này.",
  "Cà Phê": "Tách cà phê đắng giữa ban mai\nKhói tỏa hương thơm quyện tháng ngày\nNhấp ngụm bình yên đời lắng lại\nBao nỗi lo toan bỗng nhẹ lay.",
  "Cơn Mưa": "Mưa rơi tí tách góc hiên nhà\nRửa sạch muộn phiền tháng ngày qua\nThả trôi bao nỗi buồn năm cũ\nĐón ánh mai về rạng ngời hoa.",
  "Chiều Thu": "Lá vàng nhè nhẹ rụng bên sông\nHeo may khẽ thoảng buốt cõi lòng\nChiều buông nghiêng bóng người lữ thứ\nGửi chút hương thu nhớ người thương.",
  "Cuộc Sống": "Cuộc sống thăng trầm tựa dòng trôi\nCứ an nhiên sống giữa đất trời\nMiệng cười rạng rỡ lòng thanh thản\nHạnh phúc đong đầy khắp muôn nơi.",
  "Công Việc": "Bàn phím lách cách gõ từng dòng\nNhiệt huyết đam mê cháy trong lòng\nMiệt mài kiến tạo tương lai mới\nThành công gặt hái thoả ước mong."
};

const aiService = {
  /**
   * Trò chuyện thông minh với Trợ lý AI qua Backend Spring Boot (Bảo mật 100% API Key)
   * @param {string} userMessage 
   * @returns {Promise<string>}
   */
  async chatWithAI(userMessage) {
    const msg = (userMessage || "").trim();
    if (!msg) return "Bạn hãy nhập nội dung để trò chuyện với Trợ lý AI nhé! ✨";

    try {
      const response = await axiosClient.post("/ai/chat", { prompt: msg });
      if (response.data && response.data.reply) {
        return response.data.reply;
      }
      return typeof response.data === "string" ? response.data : "Trợ lý BlogViet đã nhận thông điệp!";
    } catch (err) {
      console.warn("Backend AI chat error, falling back:", err);
      // Fallback NLP nếu server chưa kết nối
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("đăng bài") || lowerMsg.includes("tạo bài")) {
        return "Để đăng bài viết mới, bạn bấm vào nút **(+) Đăng bài** ở góc trên bên phải thanh Header hoặc trên ô tạo bài viết tại Trang chủ nhé! ✨";
      }
      if (lowerMsg.includes("chat") || lowerMsg.includes("nhắn tin")) {
        return "Để nhắn tin trực tiếp với bạn bè hoặc Trợ lý AI, bạn hãy bấm vào biểu tượng bong bóng chat 💬 ở góc dưới bên phải màn hình nhé!";
      }
      if (lowerMsg.includes("chia sẻ") || lowerMsg.includes("share")) {
        return "Bạn có thể dùng nút **Chia sẻ** dưới mỗi bài viết để Quote kèm suy nghĩ cá nhân, gửi qua tin nhắn cho bạn bè hoặc sao chép liên kết bài viết!";
      }
      if (lowerMsg.includes("chào") || lowerMsg.includes("hi") || lowerMsg.includes("hello")) {
        return "Xin chào bạn! Mình là Trợ lý AI chuyên nghiệp của BlogViet (https://anhhoangg.id.vn/) ✨. Mình có thể giúp bạn sáng tạo nội dung, gợi ý chủ đề blog và hướng dẫn sử dụng nền tảng hiệu quả!";
      }
      return `Cảm ơn bạn đã nhắn: "${msg}". Mình là Trợ lý BlogViet, luôn sẵn sàng hỗ trợ bạn sáng tạo bài viết, giải đáp thắc mắc hay tư vấn thông tin bất kỳ lúc nào! 😊✨`;
    }
  },

  /**
   * Sinh bài viết tự động dựa trên prompt của người dùng
   * @param {string} prompt 
   * @returns {Promise<{title: string, content: string, hashtags: string}>}
   */
  async generatePost(prompt) {
    try {
      const p = (prompt || "").trim();
      const aiPrompt = `Hãy viết một bài đăng mạng xã hội ngắn gọn, hấp dẫn, chuẩn tiếng Việt về chủ đề: "${p}". Có bao gồm tiêu đề và vài hashtag phù hợp.`;
      const reply = await this.chatWithAI(aiPrompt);
      return {
        title: p || "Bài viết mới cùng BlogViet AI",
        content: reply,
        hashtags: "#BlogViet #AI #ChiaSe",
      };
    } catch {
      const template = SAMPLE_TEMPLATES.doi_song;
      return {
        title: prompt || template.titles[0],
        content: `${template.content}\n\n${template.hashtags}`,
        hashtags: template.hashtags,
      };
    }
  },

  async generatePostContent(prompt) {
    const res = await this.generatePost(prompt);
    return res.content || "";
  },

  async generatePoem(topic) {
    try {
      const poemPrompt = `Hãy sáng tác một bài thơ 4 câu ngắn gọn, dạt dào cảm xúc về chủ đề "${topic}".`;
      return await this.chatWithAI(poemPrompt);
    } catch {
      return POEMS_DATA[topic] || POEMS_DATA["Cuộc Sống"];
    }
  },

  async summarize(text) {
    if (!text || text.trim().length < 20) {
      return ["Nội dung bài viết quá ngắn để tóm tắt."];
    }
    try {
      const prompt = `Hãy tóm tắt bài viết sau thành 3 gạch đầu dòng ngắn gọn và súc tích:\n\n${text}`;
      const reply = await this.chatWithAI(prompt);
      return reply.split("\n").filter((l) => l.trim().length > 0);
    } catch {
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      return [
        `📌 **Ý chính**: ${lines[0] || text.slice(0, 80)}`,
        `💡 **Điểm nổi bật**: Bài viết chia sẻ thông tin chi tiết và góc nhìn thực tế.`,
        `🚀 **Kết luận**: Đáng đọc và ứng dụng cho nhu cầu tham khảo hàng ngày.`
      ];
    }
  },

  async summarizePost(text) {
    const points = await this.summarize(text);
    return Array.isArray(points) ? points.join("\n") : String(points);
  },
};

export const chatWithAI = aiService.chatWithAI.bind(aiService);
export const generatePost = aiService.generatePost.bind(aiService);
export const generatePostContent = aiService.generatePostContent.bind(aiService);
export const generatePoem = aiService.generatePoem.bind(aiService);
export const summarize = aiService.summarize.bind(aiService);
export const summarizePost = aiService.summarizePost.bind(aiService);

export default aiService;
