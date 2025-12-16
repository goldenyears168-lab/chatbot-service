import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Chatbot Service - AI 客服机器人',
    template: '%s | Chatbot Service',
  },
  description: '多租户 AI 客服机器人服务，支持自定义知识库和对话管理',
  keywords: ['AI', '客服', '聊天机器人', 'Chatbot', 'Customer Service'],
  authors: [{ name: 'Chatbot Service' }],
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: 'Chatbot Service',
    title: 'Chatbot Service - AI 客服机器人',
    description: '多租户 AI 客服机器人服务',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
