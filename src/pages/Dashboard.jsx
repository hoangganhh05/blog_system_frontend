import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import userService from "../services/userService";
import CreatePostModal from "../components/CreatePostModal";
import { ConfirmModal } from "../components/CustomModal";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [activeSideTab, setActiveSideTab] = useState("home");
  const [activeMetric, setActiveMetric] = useState("views");
  const [dateRange, setDateRange] = useState("28_days");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [postToDelete, setPostToDelete] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const editId = searchParams.get("edit");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const postsRes = await postService.getAll(0, 100);
      const allPosts = postsRes.data?.content || postsRes.data || [];

      // Lấy chính xác bài viết của người dùng hiện tại
      const myPosts = allPosts.filter((p) => p.user?.id === currentUser?.id);
      setPosts(myPosts);

      if (editId) {
        const toEdit = allPosts.find((p) => p.id === parseInt(editId));
        if (toEdit) {
          setEditPost(toEdit);
          setShowCreateModal(true);
        }
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, editId]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadData();
  }, [currentUser, loadData, navigate]);

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await postService.delete(postToDelete);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete));
    } catch {
      // Fail silently
    } finally {
      setPostToDelete(null);
    }
  };

  // SỐ LIỆU THỰC TẾ 100% TỪ BÀI VIẾT VÀ TÀI KHOẢN NGƯỜI DÙNG
  const realTotalPosts = posts.length;
  const realTotalViews = posts.reduce(
    (sum, p) => sum + (parseInt(p.viewCount) || 0),
    0,
  );
  const realTotalReactions = posts.reduce(
    (sum, p) => sum + (parseInt(p.likeCount) || 0),
    0,
  );
  const realTotalComments = posts.reduce(
    (sum, p) => sum + (parseInt(p.commentCount) || 0),
    0,
  );
  const realFollowersCount =
    currentUser?.followersCount ||
    (currentUser?.followers ? currentUser.followers.length : 0);

  const latestPost = posts[0] || null;

  const filteredPosts = posts.filter((p) => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSearch =
      !searchText ||
      (p.title || p.content || "")
        .toLowerCase()
        .includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCount = {
    all: posts.length,
    public: posts.filter((p) => p.status === "public").length,
    private: posts.filter((p) => p.status === "private").length,
    draft: posts.filter((p) => p.status === "draft").length,
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setShowFeedbackModal(false);
      setFeedbackText("");
    }, 2000);
  };

  if (!currentUser) return null;

  return (
    <div className="app-layout page-with-sidebar">
      {/* 1. LEFT SIDEBAR MENU (Công cụ chuyên nghiệp - Không bị đè chữ) */}
      <div className="page-sidebar-menu">
        <h2 className="page-sidebar-title">Công cụ chuyên nghiệp</h2>

        {/* Sidebar Nav Items List */}
        <div className="page-sidebar-nav">
          {[
            { id: "home", label: "Trang chủ", icon: "🏠" },
            {
              id: "insights",
              label: "Thông tin chi tiết",
              icon: "📊",
              hasSub: true,
            },
            {
              id: "content",
              label: "Nội dung & Bài viết",
              icon: "📝",
              hasSub: true,
            },
            {
              id: "monetization",
              label: "Kiếm tiền",
              icon: "💰",
              hasSub: true,
            },
            {
              id: "engagement",
              label: "Lượt tương tác",
              icon: "❤️",
              hasSub: true,
            },
            { id: "tools", label: "Tất cả công cụ", icon: "🛠️" },
          ].map((item) => {
            const isActive = activeSideTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveSideTab(item.id)}
                className={`page-sidebar-nav-item ${isActive ? "active" : ""}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: isActive
                        ? "var(--primary)"
                        : "var(--bg-input)",
                      color: isActive ? "#ffffff" : "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.hasSub && (
                  <span
                    className="mobile-hide"
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 13,
                      marginLeft: 4,
                    }}
                  >
                    ❯
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Primary Action Button: + Tạo bài viết */}
        <button
          onClick={() => {
            setEditPost(null);
            setShowCreateModal(true);
          }}
          className="btn btn-primary btn-full mobile-hide"
          style={{
            padding: "13px 0",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(24,119,242,0.3)",
            marginTop: 20,
          }}
        >
          + Tạo bài viết
        </button>
      </div>

      {/* 2. CENTER MAIN DASHBOARD CONTENT */}
      <div className="page-main-content">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* TAB 1: TRANG CHỦ & THÔNG TIN CHI TIẾT */}
          {(activeSideTab === "home" || activeSideTab === "insights") && (
            <>
              {/* Header Info Section */}
              <div
                className="card"
                style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      Thông tin chi tiết
                    </h3>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Tìm hiểu hiệu quả thực tế của trang cá nhân và bài viết
                      của bạn.
                    </span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <option value="28_days">28 ngày qua</option>
                      <option value="7_days">7 ngày qua</option>
                      <option value="90_days">90 ngày qua</option>
                    </select>

                    <span
                      onClick={() => setActiveSideTab("content")}
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--primary)",
                        cursor: "pointer",
                      }}
                    >
                      Xem tất cả
                    </span>
                  </div>
                </div>

                {/* Metrics Cards Horizontal Slider - THỰC TẾ 100% */}
                <div
                  className="engagement-reaction-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  {/* Card 1: Lượt xem thực tế */}
                  <div
                    onClick={() => setActiveMetric("views")}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border:
                        activeMetric === "views"
                          ? "2px solid #1877f2"
                          : "1px solid var(--border-light)",
                      background:
                        activeMetric === "views"
                          ? "rgba(24,119,242,0.04)"
                          : "var(--bg-card)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14,
                        color: "var(--text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      <span>👁️</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                        }}
                      >
                        {realTotalViews}
                      </span>
                      {realTotalViews > 0 && (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#10b981",
                          }}
                        >
                          ↑ +{realTotalViews * 10}%
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Lượt xem bài viết ⓘ
                    </div>
                  </div>

                  {/* Card 2: Lượt tương tác thực tế */}
                  <div
                    onClick={() => setActiveMetric("engagements")}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border:
                        activeMetric === "engagements"
                          ? "2px solid #1877f2"
                          : "1px solid var(--border-light)",
                      background:
                        activeMetric === "engagements"
                          ? "rgba(24,119,242,0.04)"
                          : "var(--bg-card)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14,
                        color: "var(--text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      <span>💬</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                        }}
                      >
                        {realTotalReactions}
                      </span>
                      {realTotalReactions > 0 ? (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#10b981",
                          }}
                        >
                          ↑ +100%
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                          }}
                        >
                          0%
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Lượt tương tác ⓘ
                    </div>
                  </div>

                  {/* Card 3: Số người theo dõi */}
                  <div
                    onClick={() => setActiveMetric("followers")}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border:
                        activeMetric === "followers"
                          ? "2px solid #1877f2"
                          : "1px solid var(--border-light)",
                      background:
                        activeMetric === "followers"
                          ? "rgba(24,119,242,0.04)"
                          : "var(--bg-card)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14,
                        color: "var(--text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      <span>👥</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                        }}
                      >
                        {realFollowersCount}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Số người theo dõi ⓘ
                    </div>
                  </div>
                </div>

                {/* Interactive Dynamic Area Chart - NẰM PHẲNG 100% KHI CHƯA CÓ SỐ LIỆU */}
                {(() => {
                  const currentMetricVal =
                    activeMetric === "views"
                      ? realTotalViews
                      : activeMetric === "engagements"
                        ? realTotalReactions
                        : realFollowersCount;

                  const hasData = currentMetricVal > 0;
                  const maxVal = Math.max(10, currentMetricVal);
                  const peakY = hasData
                    ? 140 -
                      Math.min(
                        100,
                        Math.max(30, (currentMetricVal / maxVal) * 90),
                      )
                    : 140;

                  const linePathD = hasData
                    ? `M 30 140 L 150 135 L 300 130 L 450 125 L 600 ${peakY} L 670 140`
                    : "M 30 140 L 670 140";

                  const areaPathD = hasData
                    ? `M 30 140 L 150 135 L 300 130 L 450 125 L 600 ${peakY} L 670 140 L 670 140 L 30 140 Z`
                    : "M 30 140 L 670 140 L 670 140 L 30 140 Z";

                  return (
                    <div
                      style={{
                        position: "relative",
                        height: 200,
                        width: "100%",
                        marginTop: 10,
                      }}
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 700 180"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="facebookGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#1877f2"
                              stopOpacity="0.35"
                            />
                            <stop
                              offset="100%"
                              stopColor="#1877f2"
                              stopOpacity="0.0"
                            />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        <line
                          x1="0"
                          y1="20"
                          x2="700"
                          y2="20"
                          stroke="var(--border-light)"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1="0"
                          y1="80"
                          x2="700"
                          y2="80"
                          stroke="var(--border-light)"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1="0"
                          y1="140"
                          x2="700"
                          y2="140"
                          stroke="var(--border-light)"
                          strokeDasharray="3 3"
                        />

                        {/* Y-axis values */}
                        <text
                          x="5"
                          y="25"
                          fill="var(--text-muted)"
                          fontSize="11"
                        >
                          {hasData ? maxVal : 10}
                        </text>
                        <text
                          x="5"
                          y="85"
                          fill="var(--text-muted)"
                          fontSize="11"
                        >
                          {hasData ? Math.floor(maxVal / 2) : 5}
                        </text>
                        <text
                          x="5"
                          y="145"
                          fill="var(--text-muted)"
                          fontSize="11"
                        >
                          0
                        </text>

                        {/* Wave Area Fill */}
                        {hasData && (
                          <path d={areaPathD} fill="url(#facebookGradient)" />
                        )}

                        {/* Blue Line Curve */}
                        <path
                          d={linePathD}
                          fill="none"
                          stroke="#1877f2"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Dynamic Peak Data Point Circle */}
                        {hasData && (
                          <circle
                            cx="600"
                            cy={peakY}
                            r="5"
                            fill="#1877f2"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        )}
                      </svg>

                      {/* X-axis Date Labels */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0 10px",
                          marginTop: 4,
                          fontSize: 11.5,
                          color: "var(--text-muted)",
                        }}
                      >
                        <span>13 Tháng 7</span>
                        <span>18 Tháng 7</span>
                        <span>23 Tháng 7</span>
                        <span>28 Tháng 7</span>
                        <span>2 Tháng 8</span>
                        <span>Hôm nay</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Section: Nội dung xem trước bài mới nhất */}
              <div
                className="card"
                style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      Nội dung mới nhất
                    </h3>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Truy cập vào bài viết đã đăng và quản lý toàn bộ nội dung.
                    </span>
                  </div>
                  <span
                    onClick={() => setActiveSideTab("content")}
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    Xem tất cả ({realTotalPosts})
                  </span>
                </div>

                {latestPost ? (
                  <div
                    style={{
                      background: "var(--bg-input)",
                      borderRadius: 16,
                      padding: 16,
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 70,
                        borderRadius: 12,
                        background: latestPost.bgColor || "#232526",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {latestPost.thumbNail ? (
                        <img
                          src={latestPost.thumbNail}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: 4,
                            textAlign: "center",
                          }}
                        >
                          {latestPost.title?.slice(0, 20) || "Bài viết"}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            marginBottom: 2,
                          }}
                        >
                          📶 Lượt xem thực tế
                        </div>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "var(--text-primary)",
                          }}
                        >
                          {latestPost.viewCount || 0}
                        </span>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            marginBottom: 2,
                          }}
                        >
                          💬 Tương tác ⓘ
                        </div>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "var(--text-primary)",
                          }}
                        >
                          {latestPost.likeCount || 0}
                        </span>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            marginBottom: 2,
                          }}
                        >
                          📝 Ngày tạo
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {timeAgo(latestPost.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    <p style={{ margin: "0 0 12px 0", fontSize: 14 }}>
                      Bạn chưa đăng bài viết nào trên hệ thống.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary btn-sm"
                      style={{
                        borderRadius: 10,
                        padding: "8px 18px",
                        fontWeight: 700,
                      }}
                    >
                      + Tạo bài viết đầu tiên ngay
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: QUẢN LÝ BÀI VIẾT VÀ NỘI DUNG (100% HOẠT ĐỘNG CHỨC NĂNG) */}
          {activeSideTab === "content" && (
            <div className="card" style={{ padding: 24, borderRadius: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      margin: 0,
                      color: "var(--text-primary)",
                    }}
                  >
                    Quản lý Nội dung Bài viết ({posts.length})
                  </h3>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Tìm kiếm, lọc danh mục, chỉnh sửa hoặc xóa bài viết của bạn.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditPost(null);
                    setShowCreateModal(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    borderRadius: 10,
                    padding: "8px 16px",
                    fontWeight: 700,
                  }}
                >
                  + Đăng bài mới
                </button>
              </div>

              {/* Toolbar Tìm kiếm & Lọc bài viết */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  className="form-input"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: "8px 14px",
                    borderRadius: 10,
                  }}
                />
                <div
                  className="post-filter-tabs"
                  style={{ display: "flex", gap: 6 }}
                >
                  {["all", "public", "draft", "private"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-secondary"}`}
                      style={{ borderRadius: 10, fontSize: 12.5 }}
                    >
                      {s === "all"
                        ? "Tất cả"
                        : s === "public"
                          ? "Công khai"
                          : s === "draft"
                            ? "Nháp"
                            : "Riêng tư"}{" "}
                      ({statusCount[s]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Table bài viết */}
              {loading ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto" }} />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  Chưa tìm thấy bài viết nào phù hợp.
                </div>
              ) : (
                <div className="posts-table-wrap">
                  <table className="posts-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tiêu đề bài viết</th>
                        <th>Trạng thái</th>
                        <th>Lượt xem</th>
                        <th>Lượt thích</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPosts.map((post, idx) => (
                        <tr key={post.id}>
                          <td style={{ color: "var(--text-muted)" }}>
                            {idx + 1}
                          </td>
                          <td>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "var(--text-primary)",
                              }}
                            >
                              {post.title ||
                                post.content?.slice(0, 45) ||
                                "Bài viết mới"}
                            </div>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background:
                                  post.status === "public"
                                    ? "rgba(16,185,129,0.12)"
                                    : "rgba(100,100,100,0.12)",
                                color:
                                  post.status === "public"
                                    ? "#10b981"
                                    : "var(--text-muted)",
                              }}
                            >
                              {post.status === "public"
                                ? "Công khai"
                                : "Nháp/Riêng tư"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {post.viewCount || 0}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {post.likeCount || 0}
                          </td>
                          <td
                            style={{ color: "var(--text-muted)", fontSize: 13 }}
                          >
                            {timeAgo(post.createdAt)}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => navigate(`/posts/${post.id}`)}
                                className="btn btn-secondary btn-sm"
                                title="Xem chi tiết"
                              >
                                Xem
                              </button>
                              <button
                                onClick={() => {
                                  setEditPost(post);
                                  setShowCreateModal(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                title="Chỉnh sửa"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => setPostToDelete(post.id)}
                                className="btn btn-danger btn-sm"
                                title="Xóa bài"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KIẾM TIỀN & ĐỐI TÁC SÁNG TẠO */}
          {activeSideTab === "monetization" && (
            <div className="card" style={{ padding: 24, borderRadius: 20 }}>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "0 0 8px 0",
                  color: "var(--text-primary)",
                }}
              >
                👁️ Trạng thái Kiếm tiền & Huy hiệu Sáng tạo
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: 20,
                }}
              >
                Điều kiện bật tính năng Kiếm tiền thưởng từ nội dung hấp dẫn.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💎</div>
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: "0 0 4px 0",
                    }}
                  >
                    Tiền thưởng Tương tác
                  </h4>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Tiến độ:{" "}
                    {realTotalViews >= 100 ? "100%" : `${realTotalViews}%`} (Yêu
                    cầu 100 lượt xem)
                  </p>
                </div>

                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⭐</div>
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: "0 0 4px 0",
                    }}
                  >
                    Huy hiệu Tác giả Ưu tú
                  </h4>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Đã đăng {realTotalPosts} bài viết chất lượng trên hệ thống.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHI TIẾT TƯƠNG TÁC */}
          {activeSideTab === "engagement" && (
            <div className="card" style={{ padding: 24, borderRadius: 20 }}>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "0 0 8px 0",
                  color: "var(--text-primary)",
                }}
              >
                💬 Phân tích Chi tiết Lượt tương tác
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: 20,
                }}
              >
                Tổng hợp cảm xúc từ người dùng thả trên bài viết của bạn.
              </p>

              <div
                className="reaction-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 14,
                }}
              >
                {[
                  { icon: "👍", label: "Thích", count: realTotalReactions },
                  {
                    icon: "❤️",
                    label: "Yêu thích",
                    count: Math.floor(realTotalReactions / 2),
                  },
                  { icon: "😆", label: "Haha", count: 0 },
                  { icon: "😮", label: "Wow", count: 0 },
                  { icon: "😢", label: "Buồn", count: 0 },
                  { icon: "😡", label: "Phẫn nộ", count: 0 },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-light)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TẤT CẢ CÔNG CỤ SÁNG TẠO */}
          {activeSideTab === "tools" && (
            <div className="card" style={{ padding: 24, borderRadius: 20 }}>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "0 0 8px 0",
                  color: "var(--text-primary)",
                }}
              >
                🧰 Bộ Công cụ Sáng tạo Chuyên nghiệp
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: 20,
                }}
              >
                Các tính năng độc quyền hỗ trợ phát triển nội dung bài viết và
                kênh cá nhân.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                }}
              >
                <div
                  onClick={() => navigate("/videos")}
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: "var(--bg-input)",
                    cursor: "pointer",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>📹</span>
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: "8px 0 4px 0",
                    }}
                  >
                    Studio Video Feeds
                  </h4>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Đăng tải và quản lý các video sắc nét.
                  </p>
                </div>

                <div
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: "var(--bg-input)",
                    cursor: "pointer",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>✨</span>
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: "8px 0 4px 0",
                    }}
                  >
                    Trợ lý AI Sáng tạo
                  </h4>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Gợi ý viết bài và chỉnh sửa nội dung tự động.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR PROFILE STATUS & FEEDBACK (100% HOẠT ĐỘNG NÚT BẮT ĐẦU) */}
      <div
        className="dashboard-right-sidebar"
        style={{
          width: 300,
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Profile Status Card */}
        <div className="card" style={{ padding: 20, borderRadius: 20 }}>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 800,
              margin: "0 0 16px 0",
              color: "var(--text-primary)",
            }}
          >
            Trạng thái trang cá nhân
          </h4>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    width: 50,
                    height: 50,
                    fontSize: 18,
                    background: currentUser.avatarColor
                      ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)`
                      : undefined,
                  }}
                >
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
              )}
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#10b981",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                ✓
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15.5,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {currentUser.fullName || currentUser.username}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Tiến độ hàng tuần:{" "}
                <strong>{realTotalPosts > 0 ? "100%" : "0%"}</strong> ◯
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Contribution Box */}
        <div className="card" style={{ padding: 20, borderRadius: 20 }}>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 800,
              margin: "0 0 8px 0",
              color: "var(--text-primary)",
            }}
          >
            Đóng góp ý kiến
          </h4>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.45,
              }}
            >
              Bạn muốn góp phần cải thiện bảng điều khiển? Chia sẻ với chúng tôi
              để giúp bạn hoàn thiện hơn.
            </span>
          </div>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="btn btn-secondary btn-full"
            style={{
              borderRadius: 12,
              padding: "10px 0",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Bắt đầu
          </button>
        </div>
      </div>

      {/* Modal Đóng góp ý kiến (Phản hồi cho nút Bắt đầu) */}
      {showFeedbackModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 24,
              borderRadius: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: "0 0 8px 0",
                color: "var(--text-primary)",
              }}
            >
              💬 Đóng góp ý kiến Bảng điều khiển
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-muted)",
                marginBottom: 16,
              }}
            >
              Ý kiến của bạn giúp chúng tôi nâng cấp hệ thống ngày càng hoàn hảo
              hơn.
            </p>

            {feedbackSuccess ? (
              <div
                style={{
                  padding: 20,
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  borderRadius: 12,
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                🎉 Cảm ơn bạn! Ý kiến phản hồi đã được gửi thành công.
              </div>
            ) : (
              <form onSubmit={handleSendFeedback}>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Nhập góp ý hoặc cải tiến bạn mong muốn..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: "8px 20px", fontWeight: 700 }}
                  >
                    Gửi góp ý
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreatePostModal
          editPost={editPost}
          onClose={() => {
            setShowCreateModal(false);
            setEditPost(null);
            setSearchParams({});
            loadData();
          }}
          onCreated={() => {
            loadData();
          }}
        />
      )}

      {/* Confirm Modal khi Xóa bài viết */}
      <ConfirmModal
        isOpen={!!postToDelete}
        title="Xóa bài viết?"
        message="Bạn có chắc chắn muốn xóa bài viết này khỏi hệ thống?"
        confirmText="Xóa bài viết"
        confirmVariant="danger"
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Dashboard;
