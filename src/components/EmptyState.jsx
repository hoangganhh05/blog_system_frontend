import React from 'react';
import { Inbox, PenSquare } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = "Chưa có bài viết nào ở chủ đề này",
  description = "Hãy là người đầu tiên chia sẻ góc nhìn hoặc câu chuyện của bạn.",
  actionText = "Tạo bài viết mới",
  onAction
}) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center gap-4 text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs animate-scale-in">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 flex items-center justify-center shadow-xs">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed mx-auto">
          {description}
        </p>
      </div>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-sm font-bold transition-transform active:scale-95 shadow-sm cursor-pointer"
        >
          <PenSquare className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
