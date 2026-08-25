import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-500 mb-4 shadow-sm animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Đã có sự cố xảy ra
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Hệ thống vừa gặp phải một lỗi nhỏ bất ngờ. Bạn hãy thử tải lại trang hoặc quay về trang chủ.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-white/90 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
