import { useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../services/aiService";

const POEM_TOPICS = ["Tình Yêu", "Cà Phê", "Cơn Mưa", "Chiều Thu", "Cuộc Sống", "Công Việc"];

function AiCreatorPage() {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState("Tình Yêu");
  const [poem, setPoem] = useState("");
  const [poemLoading, setPoemLoading] = useState(false);

  const [quoteBg, setQuoteBg] = useState("linear-gradient(135deg, #6366f1 0%, #a855f7 100%)");
  const [quote, setQuote] = useState("Hành trình vạn dặm bắt đầu từ một bước chân nhỏ bé. Hãy tin vào bản thân!");
  const [quoteAuthor, setQuoteAuthor] = useState("Triết Lý Cuộc Sống");

  const handleGeneratePoem = async (topic) => {
    setSelectedTopic(topic);
    setPoemLoading(true);
    try {
      const generatedPoem = await aiService.generatePoem(topic);
      setPoem(generatedPoem);
    } catch {
      setPoem("Nắng dịu dàng nghiêng qua góc nhỏ\nTách cà phê tỏa hương nhẹ nhàng\nGiữa nhịp đời xô xát vội vã\nGiữ cho tâm một phút bình an.");
    } finally {
      setPoemLoading(false);
    }
  };

  const handleGenerateQuote = () => {
    const quotesList = [
      { text: "Cuộc sống không phải là chờ đợi cơn bão qua đi, mà là học cách nhảy múa dưới mưa.", author: "Khuyết danh" },
      { text: "Người duy nhất bạn nên cố gắng để giỏi hơn chính là bản thân bạn của ngày hôm qua.", author: "Matty Mullins" },
      { text: "Ước mơ không có thời hạn sử dụng. Hãy hít một hơi thật sâu và thử lại lần nữa.", author: "Bình An" },
      { text: "Thành công là kết quả của sự chuẩn bị, làm việc chăm chỉ và học hỏi từ thất bại.", author: "Colin Powell" }
    ];
    const gradients = [
      "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
      "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
      "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
    ];

    const randomQ = quotesList[Math.floor(Math.random() * quotesList.length)];
    const randomBg = gradients[Math.floor(Math.random() * gradients.length)];

    setQuote(randomQ.text);
    setQuoteAuthor(randomQ.author);
    setQuoteBg(randomBg);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép vào khay nhớ tạm!");
  };

  return (
    <div className="app-layout">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
          borderRadius: 24,
          padding: "32px 28px",
          color: "#fff",
          marginBottom: 32,
          boxShadow: "0 16px 36px rgba(236, 72, 153, 0.25)",
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.9, marginBottom: 4 }}>
          🎨 Studio Sáng Tạo Nghệ Thuật
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>
          Không Gian Sáng Tạo Nghệ Thuật & Thơ Ca
        </h1>
        <p style={{ margin: 0, opacity: 0.95, fontSize: 14, maxWidth: 520, margin: "0 auto" }}>
          Tạo trích dẫn hay, viết câu thơ lãng mạn và khơi nguồn ý tưởng bài viết độc đáo tức thì!
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24 }}>
        {/* Module 1: Sáng Tác Thơ */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✍️ Sáng Tác Thơ Cảm Xúc</span>
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Chọn chủ đề gợi ý để sáng tác ngay 4 câu thơ lãng mạn cho bài viết của bạn:
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {POEM_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => handleGeneratePoem(topic)}
                style={{
                  background: selectedTopic === topic ? "var(--primary)" : "var(--bg-input)",
                  color: selectedTopic === topic ? "#fff" : "var(--text-primary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 16,
                  padding: "6px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Poetry Output Card */}
          <div
            style={{
              background: "var(--primary-light)",
              border: "1.5px solid var(--primary)",
              borderRadius: 16,
              padding: 20,
              textAlign: "center",
              position: "relative"
            }}
          >
            {poemLoading ? (
              <div style={{ color: "var(--primary)", fontWeight: 600, fontSize: 14 }}>
                ✨ AI đang cảm tác vần thơ...
              </div>
            ) : poem ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "pre-line", lineHeight: 1.7, fontStyle: "italic" }}>
                  "{poem}"
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyText(poem)}
                    style={{ borderRadius: 16, fontSize: 12 }}
                  >
                    📋 Sao chép thơ
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Bấm vào một chủ đề ở trên để bắt đầu tạo thơ!
              </div>
            )}
          </div>
        </div>

        {/* Module 2: AI Sinh Trích Dẫn Truyền Cảm Hứng (Quotes) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🎨 Canvas Trích Dẫn Nghệ Thuật</span>
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Tạo câu nói truyền cảm hứng kèm phông nền nghệ thuật đẹp mắt:
          </p>

          {/* Quote Poster Canvas */}
          <div
            style={{
              background: quoteBg,
              borderRadius: 20,
              padding: 28,
              color: "#ffffff",
              minHeight: 180,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              marginBottom: 16,
              transition: "background 0.4s ease"
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5, textShadow: "0 2px 6px rgba(0,0,0,0.3)", marginBottom: 12 }}>
              "{quote}"
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 500, letterSpacing: 0.5 }}>
              — {quoteAuthor}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerateQuote}
              style={{ flex: 1, borderRadius: 16, padding: "8px 16px" }}
            >
              🔄 Đổi trích dẫn mới
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleCopyText(`"${quote}" - ${quoteAuthor}`)}
              style={{ borderRadius: 16 }}
            >
              📋 Sao chép
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default AiCreatorPage;
