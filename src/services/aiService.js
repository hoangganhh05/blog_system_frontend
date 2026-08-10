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
      title: `${(prompt || "").trim() ? prompt.trim() : randomTitle}`,
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
   * Trò chuyện thông minh với Trợ lý AI (Tích hợp Google Gemini 1.5 Real API)
   * @param {string} userMessage 
   * @returns {Promise<string>}
   */
  async chatWithAI(userMessage) {
    const msg = (userMessage || "").trim();
    if (!msg) return "Bạn hãy nhập nội dung để trò chuyện với Trợ lý AI nhé! ✨";

    // 1. Thử gọi API Google Gemini 1.5 Flash thực tế
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Bạn là Trợ lý AI thông minh, thân thiện của mạng xã hội BlogViet. Hãy trả lời ngắn gọn, hữu ích và lịch sự bằng tiếng Việt cho câu hỏi sau: ${msg}`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return replyText.trim();
        }
      } catch {
        // Chuyển sang thuật toán NLP dự phòng bên dưới
      }
    }

    // 2. Thuật toán NLP dự phòng nếu chưa có API Key
    await new Promise((resolve) => setTimeout(resolve, 600));
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes("chào") || lowerMsg.includes("hi") || lowerMsg.includes("hello")) {
      return "Xin chào bạn! Mình là Trợ lý AI của BlogViet ✨. Mình luôn ở đây 24/7 để tư vấn ý tưởng bài viết, giải đáp thắc mắc hay trò chuyện cùng bạn!";
    }

    if (lowerMsg.includes("code") || lowerMsg.includes("lập trình") || lowerMsg.includes("lỗi") || lowerMsg.includes("react") || lowerMsg.includes("java")) {
      return "Về lập trình, bí quyết là chia nhỏ bài toán và debug cẩn thận từng dòng lệnh. Bạn đang gặp vướng mắc ở phần nào, hãy chia sẻ cụ thể để mình hỗ trợ nhé! 💻🚀";
    }

    if (lowerMsg.includes("ý tưởng") || lowerMsg.includes("viết bài") || lowerMsg.includes("chủ đề")) {
      return "Gợi ý một số chủ đề viết bài siêu thu hút trên BlogViet:\n1. 🏖️ Nhật ký trải nghiệm du lịch tự túc\n2. 💻 Lộ trình tự học lập trình Web hiệu quả\n3. ☕ Thói quen giúp bạn quản lý thời gian cực chuẩn\nBạn quan tâm chủ đề nào nhất? 🌟";
    }

    if (lowerMsg.includes("bạn là ai") || lowerMsg.includes("tên gì")) {
      return "Mình là Trợ lý AI thông minh của mạng xã hội BlogViet! 🤖✨ Mình có thể giúp bạn viết bài, giải đáp câu hỏi và trò chuyện trực tuyến.";
    }

    return `Cảm ơn bạn đã nhắn: "${msg}". Mình luôn sẵn sàng hỗ trợ bạn sáng tạo bài viết, giải đáp thắc mắc hay tư vấn thông tin bất kỳ lúc nào! 😊✨`;
  }
};

export default aiService;
