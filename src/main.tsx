import React, { Component, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in Campus Assistant:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "30px", color: "var(--text, #fff)", background: "var(--bg, #181825)", fontFamily: "sans-serif", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "10px" }}>⚠️ Đã xảy ra lỗi khởi chạy giao diện</h2>
          <p style={{ color: "var(--muted, #a6adc8)", marginBottom: "20px", maxWidth: "600px" }}>
            {this.state.error?.message || "Lỗi không xác định"}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--accent, #6d5dfc)", color: "#fff", cursor: "pointer", fontWeight: "bold" }}
          >
            Đặt lại Cấu hình Local & Tải lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

