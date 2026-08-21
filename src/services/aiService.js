/**
 * AI Assistant Service - Gọi trực tiếp Spring Boot Backend Proxy (Gemini AI bảo mật API Key)
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
   * Trò chuyện thông minh với Trợ lý AI qua Backend Spring Boot (Bảo mật 100% API Key, hỗ trợ đính kèm hình ảnh)
   * @param {string} userMessage 
   * @param {string} [imageBase64]
   * @param {string} [imageMimeType]
   * @returns {Promise<string>}
   */
  async chatWithAI(userMessage, imageBase64 = null, imageMimeType = null) {
    const msg = (userMessage || "").trim();
    if (!msg && !imageBase64) return "Bạn hãy nhập nội dung hoặc đính kèm ảnh để trò chuyện với Trợ lý AI nhé! ✨";

    try {
      const payload = {
        prompt: msg || "Hãy phân tích hình ảnh này giúp tôi.",
        imageBase64: imageBase64 || null,
        imageMimeType: imageMimeType || null,
      };

      const response = await axiosClient.post("/ai/chat", payload, {
        timeout: 60000, // 60s timeout
      });

      if (response.data && response.data.reply) {
        return response.data.reply;
      }
      return typeof response.data === "string" ? response.data : "Trợ lý BlogViet đã nhận thông điệp!";
    } catch (err) {
      console.warn("Backend AI chat error:", err);
      if (err.response?.status === 504 || err.code === "ECONNABORTED" || err.message?.includes("504")) {
        return "Hệ thống AI đang quá tải, vui lòng thử lại sau giây lát!";
      }

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
   * Stream dữ liệu thời gian thực (SSE) từ Gemini qua Backend Spring Boot
   * @param {string} userMessage
   * @param {string} [imageBase64]
   * @param {string} [imageMimeType]
   * @param {function(string): void} onChunk
   * @param {AbortSignal} [signal]
   * @param {Array<{role: string, content: string}>} [history]
   */
  async streamChatWithAI(userMessage, imageBase64 = null, imageMimeType = null, onChunk, signal = null, history = []) {
    const msg = (userMessage || "").trim();
    if (!msg && !imageBase64) {
      onChunk?.("Bạn hãy nhập nội dung hoặc đính kèm ảnh để trò chuyện với Trợ lý AI nhé! ✨");
      return;
    }

    // Xây dựng ngữ cảnh tinh gọn (chỉ 3-5 lượt trao đổi gần nhất để tối ưu TTFT)
    let promptText = msg || "Hãy phân tích hình ảnh này giúp tôi.";
    if (Array.isArray(history) && history.length > 0) {
      const historyStr = history
        .slice(-4)
        .map((h) => `${h.role === "user" ? "Người dùng" : "Trợ lý AI"}: ${h.content}`)
        .join("\n");
      promptText = `[Ngữ cảnh hội thoại gần nhất]:\n${historyStr}\n\n[Câu hỏi hiện tại]:\n${promptText}`;
    }

    const payload = {
      prompt: promptText,
      imageBase64: imageBase64 || null,
      imageMimeType: imageMimeType || null,
    };

    const headers = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream, application/json, text/plain, */*",
    };

    const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";
    const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/ai/stream`;

    let receivedAnyChunk = false;
    const safeEmitChunk = (c) => {
      if (typeof c === "string" && c.length > 0) {
        receivedAnyChunk = true;
        onChunk?.(c);
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
        credentials: "include",
      });

      if (response.status === 504) {
        throw new Error("HTTP 504: Hệ thống AI đang quá tải, vui lòng thử lại sau giây lát!");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Handle all newline variations (\r\n, \n, \r)
        const lines = buffer.split(/\r?\n/);
        // Keep the last incomplete fragment in buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // SSE data prefix
          if (trimmed.startsWith("data:") || trimmed.startsWith("data :")) {
            const dataStr = trimmed.replace(/^data\s*:\s*/, "").trim();
            if (dataStr === "[DONE]" || !dataStr) {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (typeof parsed === "string") {
                safeEmitChunk(parsed);
              } else if (parsed && typeof parsed === "object") {
                // Bỏ qua gói tin initial connection status
                if (parsed.status === "connected" || parsed.status === "connecting") {
                  continue;
                }
                if (parsed.error) {
                  throw new Error(typeof parsed.error === "string" ? parsed.error : "Hệ thống AI đang quá tải, vui lòng thử lại sau giây lát!");
                }
                const chunkContent =
                  parsed.chunk ??
                  parsed.text ??
                  parsed.content ??
                  parsed.reply ??
                  parsed.response ??
                  parsed.message ??
                  "";
                if (chunkContent) {
                  safeEmitChunk(chunkContent);
                }
              }
            } catch (e) {
              if (e.message && (e.message.includes("quá tải") || e.message.includes("504"))) {
                throw e;
              }
              // Plain text stream chunk
              safeEmitChunk(dataStr);
            }
          } else if (!trimmed.startsWith("event:") && !trimmed.startsWith("id:") && !trimmed.startsWith(":")) {
            // Direct text chunk without SSE data: prefix
            try {
              const parsed = JSON.parse(trimmed);
              if (typeof parsed === "string") {
                safeEmitChunk(parsed);
              } else if (parsed && typeof parsed === "object") {
                if (parsed.status === "connected" || parsed.status === "connecting") {
                  continue;
                }
                const chunkContent =
                  parsed.chunk ??
                  parsed.text ??
                  parsed.content ??
                  parsed.reply ??
                  parsed.response ??
                  parsed.message ??
                  "";
                if (chunkContent) {
                  safeEmitChunk(chunkContent);
                }
              }
            } catch {
              safeEmitChunk(trimmed);
            }
          }
        }
      }

      // Check remaining buffer
      if (buffer.trim()) {
        const remaining = buffer.trim();
        if (remaining.startsWith("data:") || remaining.startsWith("data :")) {
          const dataStr = remaining.replace(/^data\s*:\s*/, "").trim();
          if (dataStr && dataStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.status !== "connected") {
                const chunkContent =
                  typeof parsed === "string"
                    ? parsed
                    : parsed?.chunk ?? parsed?.text ?? parsed?.content ?? parsed?.reply ?? "";
                if (chunkContent) safeEmitChunk(chunkContent);
              }
            } catch {
              safeEmitChunk(dataStr);
            }
          }
        } else if (!remaining.startsWith(":") && !remaining.startsWith("event:")) {
          safeEmitChunk(remaining);
        }
      }

      // If stream ended but no chunks were captured, fallback to sync API
      if (!receivedAnyChunk) {
        console.warn("[STREAM EMPTY, FALLBACK TO SYNC CHAT]");
        const fallbackReply = await this.chatWithAI(userMessage, imageBase64, imageMimeType);
        if (fallbackReply) {
          safeEmitChunk(fallbackReply);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.warn("[STREAM FAIL, FALLBACK TO SYNC]", err);
      if (err.message?.includes("504") || err.message?.includes("quá tải")) {
        throw new Error("Hệ thống AI đang quá tải, vui lòng thử lại sau giây lát!");
      }
      try {
        const fallbackReply = await this.chatWithAI(userMessage, imageBase64, imageMimeType);
        if (fallbackReply) {
          safeEmitChunk(fallbackReply);
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback chat failed:", fallbackErr);
      }
      throw err;
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
};

export default aiService;
