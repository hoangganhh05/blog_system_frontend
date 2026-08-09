/**
 * AI Assistant Service - Sinh nội dung bài viết thông minh & Tóm tắt nội dung
 */

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

const aiService = {
  /**
   * Sinh bài viết tự động dựa trên prompt của người dùng
   * @param {string} prompt 
   * @returns {Promise<{title: string, content: string, hashtags: string}>}
   */
  async generatePost(prompt) {
    // Giả lập xử lý AI siêu tốc (mô phỏng gọi AI Model)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const p = (prompt || "").toLowerCase();
    let template = SAMPLE_TEMPLATES.doi_song;

    if (p.includes("du lịch") || p.includes("đi chơi") || p.includes("phượt") || p.includes("travel")) {
      template = SAMPLE_TEMPLATES.du_lich;
    } else if (p.includes("code") || p.includes("lập trình") || p.includes("java") || p.includes("web") || p.includes("cntt")) {
      template = SAMPLE_TEMPLATES.lap_trinh;
    }

    const randomTitle = template.titles[Math.floor(Math.random() * template.titles.length)];
    const generatedContent = `${template.content}\n\n${template.hashtags}`;

    return {
      title: `${prompt.trim() ? prompt.trim() : randomTitle}`,
      content: generatedContent,
      hashtags: template.hashtags,
    };
  },

  /**
   * Tóm tắt bài viết thành 3 ý chính
   * @param {string} text 
   * @returns {Promise<string[]>}
   */
  async summarize(text) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!text || text.trim().length < 20) {
      return ["Nội dung bài viết quá ngắn để tóm tắt."];
    }

    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const summaryPoints = [
      `📌 **Ý chính**: ${lines[0] || text.slice(0, 80)}`,
      `💡 **Điểm nổi bật**: Bài viết chia sẻ thông tin chi tiết và góc nhìn thực tế.`,
      `🚀 **Kết luận**: Đáng đọc và ứng dụng cho nhu cầu tham khảo hàng ngày.`
    ];

    return summaryPoints;
  },

  /**
   * Trò chuyện thông minh với Trợ lý AI
   * @param {string} userMessage 
   * @returns {Promise<string>}
   */
  async chatWithAI(userMessage) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const msg = (userMessage || "").toLowerCase();

    if (msg.includes("chào") || msg.includes("hi") || msg.includes("hello")) {
      return "Xin chào bạn! Mình là Trợ lý AI của BlogViet. Mình có thể giúp gì cho bạn hôm nay? (Gợi ý bài viết, giải đáp thắc mắc, trò chuyện thư giãn...) 🤖✨";
    }

    if (msg.includes("code") || msg.includes("lập trình") || msg.includes("lỗi") || msg.includes("react") || msg.includes("java")) {
      return "Về lập trình, lời khuyên tốt nhất là chia nhỏ vấn đề và kiểm tra cẩn thận từng đoạn code. Bạn đang gặp vướng mắc ở phần nào, hãy mô tả chi tiết để mình hỗ trợ nhé! 💻🚀";
    }

    if (msg.includes("ý tưởng") || msg.includes("viết bài") || msg.includes("chủ đề")) {
      return "Một số chủ đề viết bài đang rất 'Hot' trên BlogViet:\n1. 🏖️ Trải nghiệm du lịch tự túc\n2. 💻 Bài học kinh nghiệm học Lập trình\n3. ☕ Thói quen giúp làm việc hiệu quả mỗi ngày\nBạn thích chủ đề nào nhất? 🌟";
    }

    if (msg.includes("bạn là ai") || msg.includes("tên gì")) {
      return "Mình là Trợ lý AI thông minh của hệ thống BlogViet! 🤖 Mình luôn ở đây 24/7 để hỗ trợ bạn sáng tạo nội dung và giải đáp mọi câu hỏi.";
    }

    return `Cảm ơn bạn đã chia sẻ: "${userMessage}". Cần gợi ý ý tưởng viết bài, trò chuyện hay hỏi đáp thông tin gì thêm, bạn cứ nhắn cho mình nhé! 😊🤖`;
  }
};

export default aiService;
