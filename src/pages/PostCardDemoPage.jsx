import React from 'react';
import PostCardDemoGrid from '../components/PostCardDemoGrid';

const PostCardDemoPage = () => {
  // Dữ liệu mẫu cho bài viết
  const samplePosts = [
    {
      id: 1,
      content: "Hôm nay mình vừa hoàn thành xong project ReactJS đầu tiên! 🎉 Cảm giác thật tuyệt vời khi nhìn ứng dụng chạy mượt mà. Cảm ơn mọi người đã hỗ trợ mình trong suốt quá trình học tập.",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
      author: "Nguyễn Văn A",
      authorAvatar: "https://i.pravatar.cc/150?img=1",
      date: "15 phút trước",
      likes: 89,
      comments: 24,
      shares: 12
    },
    {
      id: 2,
      content: "Top 10 công nghệ web nên học năm 2024 🚀 React, Vue, Angular, Node.js, TypeScript... Bạn đang học công nghệ nào? Comment bên dưới nhé!",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
      author: "Trần Thị B",
      authorAvatar: "https://i.pravatar.cc/150?img=2",
      date: "1 giờ trước",
      likes: 156,
      comments: 42,
      shares: 28
    },
    {
      id: 3,
      content: "Mẹo nhỏ: useMemo và useCallback không phải là silver bullet! 🤔 Chỉ dùng khi thực sự cần thiết,否则 sẽ làm code phức tạp hơn mà không cải thiện performance.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
      author: "Lê Văn C",
      authorAvatar: "https://i.pravatar.cc/150?img=3",
      date: "2 giờ trước",
      likes: 67,
      comments: 18,
      shares: 8
    },
    {
      id: 4,
      content: "CSS Grid vs Flexbox - khi nào dùng gì? 🤔 Grid cho layout 2D, Flexbox cho layout 1D. Đừng lạm dụng, chọn đúng công cụ cho đúng việc!",
      image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=600&fit=crop",
      author: "Phạm Thị D",
      authorAvatar: "https://i.pravatar.cc/150?img=4",
      date: "3 giờ trước",
      likes: 112,
      comments: 35,
      shares: 19
    },
    {
      id: 5,
      content: "Xây dựng API RESTful với Node.js và Express - Series phần 1 đã lên! 🔥 Link trong bio. Follow để không bỏ lỡ phần 2 nhé!",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop",
      author: "Hoàng Văn E",
      authorAvatar: "https://i.pravatar.cc/150?img=5",
      date: "5 giờ trước",
      likes: 145,
      comments: 51,
      shares: 34
    },
    {
      id: 6,
      content: "TypeScript đã thay đổi cách mình viết code React hoàn toàn! 💪 Không còn undefined errors, code readable hơn, maintain dễ hơn. Bạn đã dùng TS chưa?",
      image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=600&fit=crop",
      author: "Đỗ Thị F",
      authorAvatar: "https://i.pravatar.cc/150?img=6",
      date: "6 giờ trước",
      likes: 98,
      comments: 29,
      shares: 15
    },
    {
      id: 7,
      content: "Redux Toolkit make state management a breeze! 🌊 configureStore, createSlice, createAsyncThunk... mọi thứ trở nên đơn giản hơn bao giờ hết.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      author: "Vũ Văn G",
      authorAvatar: "https://i.pravatar.cc/150?img=7",
      date: "8 giờ trước",
      likes: 87,
      comments: 22,
      shares: 11
    },
    {
      id: 8,
      content: "Testing is not optional, it's essential! 🧪 Jest + React Testing Library = perfect combo cho unit test và integration test. Bắt đầu test ngay hôm nay!",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
      author: "Nguyễn Thị H",
      authorAvatar: "https://i.pravatar.cc/150?img=8",
      date: "12 giờ trước",
      likes: 76,
      comments: 19,
      shares: 9
    }
  ];

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: 'var(--bg-main)', paddingTop: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: '680px', padding: '0 16px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Demo Post Cards
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              Bộ sưu tập các bài viết mẫu với thiết kế đẹp mắt và responsive
            </p>
          </div>

          {/* Grid */}
          <PostCardDemoGrid posts={samplePosts} />
        </div>
      </div>
    </div>
  );
};

export default PostCardDemoPage;
