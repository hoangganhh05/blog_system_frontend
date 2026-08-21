import React, { createContext, useContext, useState, useEffect } from "react";

export const SUPPORTED_LANGUAGES = [
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", flag: "🇻🇳", direction: "ltr" },
  { code: "en", nativeName: "English", englishName: "English", flag: "🇺🇸", direction: "ltr" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", flag: "🇯🇵", direction: "ltr" },
  { code: "zh", nativeName: "中文 (简体)", englishName: "Chinese (Simplified)", flag: "🇨🇳", direction: "ltr" }
];

export const translations = {
  vi: {
    "common.language": "Ngôn ngữ",
    "common.selectLanguage": "Chọn ngôn ngữ",
    "common.searchLanguage": "Tìm kiếm ngôn ngữ...",
    "common.close": "Đóng",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.loading": "Đang tải...",
    "common.error": "Đã có lỗi xảy ra",
    "post.translate": "Dịch bài viết",
    "post.translating": "Đang dịch...",
    "post.viewOriginal": "Xem nguyên bản",
    "post.translatedFrom": "Đã dịch từ {{lang}}",
    "post.translationFailed": "Không thể dịch bài viết. Vui lòng thử lại sau.",
    "nav.home": "Trang chủ",
    "nav.videos": "Shorts Video",
    "nav.friends": "Bạn bè",
    "nav.profile": "Trang cá nhân",
    "nav.settings": "Cài đặt & Quyền riêng tư",
    "settings.languageTitle": "Ngôn ngữ hiển thị",
    "settings.languageDesc": "Chọn ngôn ngữ bạn muốn hiển thị trên giao diện BlogViet",
  },
  en: {
    "common.language": "Language",
    "common.selectLanguage": "Select Language",
    "common.searchLanguage": "Search language...",
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "post.translate": "Translate post",
    "post.translating": "Translating...",
    "post.viewOriginal": "View original",
    "post.translatedFrom": "Translated from {{lang}}",
    "post.translationFailed": "Could not translate post. Please try again later.",
    "nav.home": "Home",
    "nav.videos": "Shorts Video",
    "nav.friends": "Friends",
    "nav.profile": "Profile",
    "nav.settings": "Settings & Privacy",
    "settings.languageTitle": "Display Language",
    "settings.languageDesc": "Choose your preferred language for the BlogViet interface",
  },
  ja: {
    "common.language": "言語",
    "common.selectLanguage": "言語を選択",
    "common.searchLanguage": "言語を検索...",
    "common.close": "閉じる",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中...",
    "common.error": "エラーが発生しました",
    "post.translate": "投稿を翻訳",
    "post.translating": "翻訳中...",
    "post.viewOriginal": "原文を表示",
    "post.translatedFrom": "{{lang}}から翻訳済み",
    "post.translationFailed": "投稿を翻訳できませんでした。後でもう一度お試しください。",
    "nav.home": "ホーム",
    "nav.videos": "ショート動画",
    "nav.friends": "友達",
    "nav.profile": "プロフィール",
    "nav.settings": "設定とプライバシー",
    "settings.languageTitle": "表示言語",
    "settings.languageDesc": "BlogVietの表示言語を選択してください",
  },
  zh: {
    "common.language": "语言",
    "common.selectLanguage": "选择语言",
    "common.searchLanguage": "搜索语言...",
    "common.close": "关闭",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.loading": "加载中...",
    "common.error": "发生错误",
    "post.translate": "翻译帖子",
    "post.translating": "翻译中...",
    "post.viewOriginal": "查看原文",
    "post.translatedFrom": "已从{{lang}}翻译",
    "post.translationFailed": "无法翻译帖子。请稍后再试。",
    "nav.home": "首页",
    "nav.videos": "短视频",
    "nav.friends": "好友",
    "nav.profile": "个人主页",
    "nav.settings": "设置与隐私",
    "settings.languageTitle": "显示语言",
    "settings.languageDesc": "选择在BlogViet上显示的首选语言",
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children, currentUser, onUpdateUserPreference }) {
  const [language, setLanguage] = useState(() => {
    if (currentUser?.preferredLanguage) return currentUser.preferredLanguage;
    const saved = localStorage.getItem("blog_lang");
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) return saved;
    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang && SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) return browserLang;
    return "vi";
  });

  useEffect(() => {
    if (currentUser?.preferredLanguage && currentUser.preferredLanguage !== language) {
      setLanguage(currentUser.preferredLanguage);
    }
  }, [currentUser?.preferredLanguage]);

  const changeLanguage = (code) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === code)) return;
    setLanguage(code);
    localStorage.setItem("blog_lang", code);

    // Update document direction if RTL is supported
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (langObj) {
      document.documentElement.dir = langObj.direction || "ltr";
      document.documentElement.lang = code;
    }

    if (currentUser?.id && onUpdateUserPreference) {
      onUpdateUserPreference(code);
    }
  };

  const t = (key, params = {}) => {
    const langDict = translations[language] || translations["vi"];
    let text = langDict[key] || translations["vi"][key] || key;
    Object.keys(params).forEach((p) => {
      text = text.replace(new RegExp(`{{${p}}}`, "g"), params[p]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: "vi",
      setLanguage: () => {},
      t: (key) => key,
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return ctx;
}
