// composables/useBTSESocket.ts
import { ref } from 'vue'

interface BTSESocketOptions {
  url: string
  topic: string
  onMessage: (data: any) => void
}

/** BTSE WebSocket連接管理函數 */
export function useBTSESocket({ url, topic, onMessage }: BTSESocketOptions) {
  /** WebSocket連接狀態 */
  const isConnected = ref(false)
  /** WebSocket實例 */
  let ws: WebSocket | null = null

  /** 建立WebSocket連接 */
  const connect = () => {
    // 如果已經連接或正在連接中則不重複連接
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return
    }

    // 創建新的WebSocket實例
    ws = new WebSocket(url)

    /** WebSocket連接成功時的處理函數 */
    ws.onopen = () => {
      isConnected.value = true
      // 發送訂閱請求
      ws?.send(JSON.stringify({ op: 'subscribe', args: [topic] }))
      console.log('[WebSocket connected]', topic)
    }

    /** WebSocket接收消息時的處理函數 */
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      // 檢查消息主題是否匹配訂閱主題
      if (msg.topic?.startsWith(topic.split(':')[0])) {
        onMessage(msg.data)
      }
    }

    /** WebSocket發生錯誤時的處理函數 */
    ws.onerror = (err) => {
      isConnected.value = false
      console.error('[WebSocket error]', err)
    }

    /** WebSocket連接關閉時的處理函數 */
    ws.onclose = () => {
      isConnected.value = false
    }
  }

  /** 關閉WebSocket連接 */
  const disconnect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    ws = null
    isConnected.value = false
  }

  return {
    isConnected,
    connect,
    disconnect,
  }
}