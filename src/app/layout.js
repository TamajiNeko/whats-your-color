import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const lineSeedSans = localFont({
  src: "../../public/LINESeedSansTH_Rg.ttf",
  variable: "--font-line-seed",
  display: "swap",
});

export const metadata = {
  title: "น้องอยู่สีอะไร?",
  description: "ระบบตรวจสอบสีกิจกรรมรับน้อง 69 - คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มรพส.",
  openGraph: {
    title: "น้องอยู่สีอะไร?",
    description: "ระบบตรวจสอบสีกิจกรรมรับน้อง 69 - คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มรพส.",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "thumbnail",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${lineSeedSans.variable} h-full`}>
      <body className="h-full antialiased font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
