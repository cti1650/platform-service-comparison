"use client";

interface HeaderProps {
  totalServices: number;
}

export function Header({ totalServices }: HeaderProps) {
  return (
    <header className="header-section relative py-8 sm:py-12 lg:py-16 px-4">
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm mb-4 backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>{totalServices.toLocaleString()}+ サービスを収録</span>
        </div>
        <h1 className="header-title text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          iPaaS連携サービス比較ツール
        </h1>
        <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Zapier, IFTTT, Make, Power Automate, n8n, Yoom, Dify, Anyflow
          <br className="hidden sm:block" />
          主要8プラットフォームの連携サービスを横断検索
        </p>
      </div>
    </header>
  );
}
