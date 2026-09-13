import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "RefCheck AI",
  description: "Automated employment reference verification by phone",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1D1D1F",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
              padding: "12px 18px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            },
            success: { iconTheme: { primary: "#34C759", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#FF3B30", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
