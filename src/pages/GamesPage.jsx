import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import gameService from "../services/gameService";

// --- GAME 1: CỜ CARÔ ONLINE MULTIPLAYER & AI ---
function OnlineCaroGame() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;
  const currentUserName = currentUser ? (currentUser.fullName || currentUser.username) : "Người chơi";

  const [mode, setMode] = useState("online"); // 'online' hoặc 'ai'

  // Online State
  const [room, setRoom] = useState(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [openRooms, setOpenRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Offline AI State
  const [aiBoard, setAiBoard] = useState(Array(9).fill(""));
  const [aiIsXNext, setAiIsXNext] = useState(true);
  const [aiWinner, setAiWinner] = useState(null);

  // Fetch danh sách phòng đang chờ khi mở tab online
  useEffect(() => {
    if (mode === "online" && !room) {
      fetchOpenRooms();
      const interval = setInterval(fetchOpenRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [mode, room]);

  // Polling trạng thái phòng khi đã vào phòng
  useEffect(() => {
    let timer;
    if (mode === "online" && room?.roomCode) {
      timer = setInterval(() => {
        gameService.getCaroRoom(room.roomCode).then((res) => {
          if (res.data) setRoom(res.data);
        }).catch(() => {});
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [mode, room?.roomCode]);

  const fetchOpenRooms = () => {
    gameService.getOpenCaroRooms().then((res) => {
      setOpenRooms(res.data || []);
    }).catch(() => {});
  };

  // 1. Tạo phòng Online
  const handleCreateRoom = async () => {
    if (!currentUserId) {
      setErrorMsg("Vui lòng đăng nhập để tạo phòng đấu online!");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await gameService.createCaroRoom(currentUserId, currentUserName);
      setRoom(res.data);
    } catch {
      setErrorMsg("Không thể tạo phòng lúc này. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Tham gia phòng theo Mã
  const handleJoinRoom = async (codeToJoin) => {
    const code = codeToJoin || roomCodeInput.trim();
    if (!code) {
      setErrorMsg("Vui lòng nhập Mã Phòng!");
      return;
    }
    if (!currentUserId) {
      setErrorMsg("Vui lòng đăng nhập để tham gia!");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await gameService.joinCaroRoom(code, currentUserId, currentUserName);
      setRoom(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data || "Không thể tham gia phòng này!");
    } finally {
      setLoading(false);
    }
  };

  // 3. Đánh cờ Online
  const handleOnlineMove = async (cellIndex) => {
    if (!room || room.status !== "PLAYING") return;
    if (room.turnId !== currentUserId) return;
    if (room.board[cellIndex]) return;

    try {
      const res = await gameService.makeCaroMove(room.roomCode, currentUserId, cellIndex);
      setRoom(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data || "Lỗi khi đánh cờ!");
    }
  };

  // 4. Chơi lại Online
  const handleRestartOnline = async () => {
    if (!room?.roomCode) return;
    try {
      const res = await gameService.restartCaroGame(room.roomCode);
      setRoom(res.data);
    } catch {
      // Fail silently
    }
  };

  // --- Offline AI Logic ---
  const checkWin = (b, s) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return lines.some(([x, y, z]) => s && b[x] === s && b[y] === s && b[z] === s);
  };

  const handleAiMoveClick = (idx) => {
    if (aiBoard[idx] || aiWinner || !aiIsXNext) return;

    const newB = [...aiBoard];
    newB[idx] = "X";
    setAiBoard(newB);

    if (checkWin(newB, "X")) {
      setAiWinner("X");
      return;
    } else if (newB.every(Boolean)) {
      setAiWinner("TIE");
      return;
    }

    setAiIsXNext(false);

    // AI phản hồi
    setTimeout(() => {
      const empty = newB.map((v, i) => (!v ? i : null)).filter((v) => v !== null);
      if (empty.length > 0) {
        const choice = empty[Math.floor(Math.random() * empty.length)];
        const aiB = [...newB];
        aiB[choice] = "O";
        setAiBoard(aiB);
        if (checkWin(aiB, "O")) {
          setAiWinner("O");
        } else if (aiB.every(Boolean)) {
          setAiWinner("TIE");
        } else {
          setAiIsXNext(true);
        }
      }
    }, 400);
  };

  const resetAiGame = () => {
    setAiBoard(Array(9).fill(""));
    setAiIsXNext(true);
    setAiWinner(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* Mode Switcher Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => { setMode("online"); setRoom(null); }}
          style={{
            background: mode === "online" ? "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)" : "var(--bg-input)",
            color: mode === "online" ? "#fff" : "var(--text-primary)",
            border: "none",
            borderRadius: 20,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: mode === "online" ? "0 4px 14px rgba(79, 70, 229, 0.35)" : "none"
          }}
        >
          🌐 Chơi Online Real-time
        </button>
        <button
          onClick={() => { setMode("ai"); resetAiGame(); }}
          style={{
            background: mode === "ai" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "var(--bg-input)",
            color: mode === "ai" ? "#fff" : "var(--text-primary)",
            border: "none",
            borderRadius: 20,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: mode === "ai" ? "0 4px 14px rgba(16, 185, 129, 0.35)" : "none"
          }}
        >
          🤖 Thực Hành Với AI Bot
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "8px 16px", borderRadius: 12, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* MODE 1: ONLINE MULTIPLAYER */}
      {mode === "online" ? (
        !room ? (
          /* Khung Tạo / Tìm Phòng Online */
          <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-light)", borderRadius: 20, padding: 24, textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                ⚔️ Đấu Cờ Carô Real-time 2 Người
              </h3>
              <p style={{ margin: "0 0 20px 0", fontSize: 13, color: "var(--text-muted)" }}>
                Tạo phòng mới gửi Mã cho bạn bè hoặc chọn tham gia phòng đang mở!
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ borderRadius: 18, padding: "10px 24px", fontWeight: 700 }}
                >
                  ➕ Tạo Phòng Mới
                </button>
              </div>

              <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>HOẶC NHẬP MÃ PHÒNG</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Nhập mã phòng (Ví dụ: 8492)..."
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    background: "var(--bg-input)",
                    border: "1.5px solid var(--border-light)",
                    borderRadius: 14,
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ borderRadius: 14, padding: "10px 20px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  Tham Gia
                </button>
              </div>
            </div>

            {/* Danh sách các phòng đang mở */}
            <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-light)", borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🌐 Danh Sách Phòng Đang Chờ ({openRooms.length})</span>
                <button onClick={fetchOpenRooms} className="btn btn-secondary btn-sm" style={{ borderRadius: 12, fontSize: 11 }}>🔄 Làm mới</button>
              </div>

              {openRooms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
                  Chưa có phòng nào đang chờ. Hãy bấm <strong>Tạo Phòng Mới</strong> để rủ bạn bè vào đấu!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {openRooms.map((r) => (
                    <div
                      key={r.roomCode}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--bg-input)",
                        padding: "10px 16px",
                        borderRadius: 14
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--primary)" }}>Phòng #{r.roomCode}</span>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Chủ phòng: <strong>{r.hostName}</strong></div>
                      </div>

                      <button
                        onClick={() => handleJoinRoom(r.roomCode)}
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: 12, padding: "6px 16px", fontWeight: 700 }}
                      >
                        Vào Đấu ⚔️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Trong Khung Trận Đấu Online */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary)", borderRadius: 16, padding: "8px 20px", marginBottom: 16, fontWeight: 800, fontSize: 15 }}>
              🔑 Mã Phòng: <span style={{ color: "#4f46e5", letterSpacing: 1 }}>{room.roomCode}</span> (Gửi mã này cho bạn bè)
            </div>

            {/* Match Header */}
            <div style={{ display: "flex", gap: 20, background: "var(--bg-card)", border: "1px solid var(--border-light)", padding: "12px 24px", borderRadius: 20, marginBottom: 20, fontSize: 14, fontWeight: 700 }}>
              <div style={{ color: "#4f46e5" }}>
                🟦 Host (X): <strong>{room.hostName}</strong> {room.hostId === currentUserId && "(Bạn)"}
              </div>
              <div style={{ color: "var(--text-muted)" }}>VS</div>
              <div style={{ color: "#ef4444" }}>
                🟥 Khách (O): <strong>{room.guestName || "Đang chờ vào..."}</strong> {room.guestId === currentUserId && "(Bạn)"}
              </div>
            </div>

            {/* Turn & Status Banner */}
            <div style={{ marginBottom: 16, fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textAlign: "center" }}>
              {room.status === "WAITING" ? (
                <span style={{ color: "#f59e0b" }}>⏳ Đang chờ người chơi 2 tham gia...</span>
              ) : room.status === "FINISHED" ? (
                <span style={{ color: "#10b981", fontSize: 16 }}>
                  🎉 {room.winnerSymbol === "TIE" ? "Trận đấu Hòa!" : `Người chơi ${room.winnerSymbol} (${room.winnerId === room.hostId ? room.hostName : room.guestName}) Thắng!`}
                </span>
              ) : (
                <span>
                  Lượt đi: <strong style={{ color: room.turnId === room.hostId ? "#4f46e5" : "#ef4444" }}>
                    {room.turnId === room.hostId ? `${room.hostName} (X)` : `${room.guestName} (O)`}
                    {room.turnId === currentUserId && " - ĐẾN LƯỢT BẠN!"}
                  </strong>
                </span>
              )}
            </div>

            {/* BÀN CỜ 3X3 ĐẸP CHUẨN 100% VISIBLE */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 80px)",
                gridTemplateRows: "repeat(3, 80px)",
                gap: 12,
                background: "var(--bg-input)",
                padding: 16,
                borderRadius: 24,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                marginBottom: 20
              }}
            >
              {(room.board || Array(9).fill("")).map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOnlineMove(idx)}
                  disabled={room.status !== "PLAYING" || room.turnId !== currentUserId || !!cell}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    border: "2px solid var(--border-light)",
                    background: cell === "X" ? "rgba(79,70,229,0.12)" : cell === "O" ? "rgba(239,68,68,0.12)" : "var(--bg-card)",
                    fontSize: 36,
                    fontWeight: 800,
                    color: cell === "X" ? "#4f46e5" : "#ef4444",
                    cursor: room.status === "PLAYING" && room.turnId === currentUserId && !cell ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    transition: "transform 0.15s, background 0.15s"
                  }}
                >
                  {cell}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {room.status === "FINISHED" && (
                <button onClick={handleRestartOnline} className="btn btn-primary" style={{ borderRadius: 16, padding: "8px 24px", fontWeight: 700 }}>
                  🔄 Đấu Ván Mới
                </button>
              )}
              <button onClick={() => setRoom(null)} className="btn btn-secondary" style={{ borderRadius: 16, padding: "8px 20px" }}>
                🚪 Rời Phòng
              </button>
            </div>
          </div>
        )
      ) : (
        /* MODE 2: OFFLINE AI BOT */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            {aiWinner ? (
              <span style={{ color: aiWinner === "X" ? "#4f46e5" : "#ef4444" }}>
                🎉 {aiWinner === "X" ? "Bạn đã thắng AI Bot!" : aiWinner === "O" ? "AI Bot thắng!" : "Trận đấu hòa!"}
              </span>
            ) : (
              <span>Lượt đi: <strong>{aiIsXNext ? "Bạn (X)" : "AI đang suy nghĩ (O)..."}</strong></span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 80px)",
              gridTemplateRows: "repeat(3, 80px)",
              gap: 12,
              background: "var(--bg-input)",
              padding: 16,
              borderRadius: 24,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              marginBottom: 20
            }}
          >
            {aiBoard.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleAiMoveClick(idx)}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  border: "2px solid var(--border-light)",
                  background: cell === "X" ? "rgba(79,70,229,0.12)" : cell === "O" ? "rgba(239,68,68,0.12)" : "var(--bg-card)",
                  fontSize: 36,
                  fontWeight: 800,
                  color: cell === "X" ? "#4f46e5" : "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}
              >
                {cell}
              </button>
            ))}
          </div>

          <button onClick={resetAiGame} className="btn btn-primary" style={{ borderRadius: 16, padding: "8px 24px", fontWeight: 700 }}>
            🔄 Ván mới
          </button>
        </div>
      )}
    </div>
  );
}

function GamesPage() {
  return (
    <div className="app-layout games-page">
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px" }}>
        {/* Hero Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
            borderRadius: 24,
            padding: "32px 28px",
            color: "#fff",
            marginBottom: 28,
            boxShadow: "0 16px 36px rgba(124, 58, 237, 0.25)",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.9, marginBottom: 4 }}>
            🌐 BlogViet Online Multiplayer Arena
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>
            Đấu Cờ Carô Real-time Với Bạn Bè
          </h1>
          <p style={{ margin: "0 auto", opacity: 0.95, fontSize: 14, maxWidth: 520 }}>
            Tạo phòng mới hoặc tham gia phòng đấu real-time trực tiếp trên hệ thống. Đấu cờ mượt mà giữa các trình duyệt & thiết bị!
          </p>
        </div>

        {/* Game Main Frame */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <OnlineCaroGame />
        </div>
      </div>
    </div>
  );
}

export default GamesPage;
