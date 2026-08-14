import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen = true,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện thao tác này?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = true,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer ${
              isDanger
                ? "text-white bg-rose-600 hover:bg-rose-700 active:scale-98"
                : "text-white bg-black dark:bg-white dark:text-black hover:opacity-90 active:scale-98"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
