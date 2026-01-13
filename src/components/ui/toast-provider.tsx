import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.75rem",
          padding: "16px",
          boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.3)",
        },
        success: {
          iconTheme: {
            primary: "hsl(var(--primary))",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "white",
          },
        },
      }}
    />
  );
}
