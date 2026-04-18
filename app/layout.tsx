import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@ant-design/v5-patch-for-react-19";
import "antd/dist/reset.css";
import QueryProvider from "../components/providers/QueryProvider";
import AuthProvider from "../components/providers/AuthProvider";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "The Coffee House - Cafe Management System",
  description: "Coffee shop management system with order, invoice, and menu management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
