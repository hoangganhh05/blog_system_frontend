import { encryptData, decryptData } from "../utils/cryptoUtil";

/**
 * Secure WebSocket Service with End-to-End Payload Encryption (AES-256)
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  /**
   * Connect to backend Secure WebSocket server
   */
  connect(token = null) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const authToken = token || localStorage.getItem("blog_token");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;

    // Use relative reverse proxy path or fallback
    const wsUrl = `${protocol}//${host}/ws/realtime${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.info("[SECURE WS] Kênh WebSocket mã hóa đã kết nối thành công.");
      };

      this.ws.onmessage = async (event) => {
        try {
          const rawData = event.data;
          let parsedData = rawData;

          try {
            parsedData = JSON.parse(rawData);
          } catch {}

          // Auto-decrypt if incoming payload is encrypted
          let finalData = parsedData;
          if (parsedData && typeof parsedData === "object" && parsedData.encryptedData) {
            finalData = await decryptData(parsedData.encryptedData);
          } else if (typeof parsedData === "string") {
            finalData = await decryptData(parsedData);
          }

          // Notify all subscribers
          this.subscribers.forEach((callback) => {
            try {
              callback(finalData);
            } catch (err) {
              console.warn("[SECURE WS CALLBACK ERROR]", err);
            }
          });
        } catch (err) {
          console.warn("[SECURE WS MESSAGE ERROR]", err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 5 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[SECURE WS ERROR]", err);
        this.ws?.close();
      };
    } catch (e) {
      console.warn("[SECURE WS INIT ERROR]", e);
    }
  }

  /**
   * Send transparently encrypted message over WebSocket
   */
  async sendSecure(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[SECURE WS] Không thể gửi gói tin, WebSocket chưa kết nối.");
      return false;
    }

    try {
      const cipherText = await encryptData(payload);
      const wrappedPayload = JSON.stringify({ encryptedData: cipherText });
      this.ws.send(wrappedPayload);
      return true;
    } catch (err) {
      console.error("[SECURE WS SEND ERROR]", err);
      return false;
    }
  }

  /**
   * Subscribe to real-time decrypted messages
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

const secureWebSocket = new WebSocketService();
export default secureWebSocket;
