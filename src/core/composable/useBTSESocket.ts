// composables/useBTSESocket.ts
import { ref } from 'vue'

interface BTSESocketOptions {
  url: string
  topic: string
  onMessage: (data: any) => void
}

export function useBTSESocket({ url, topic, onMessage }: BTSESocketOptions) {
  const isConnected = ref(false)
  let ws: WebSocket | null = null

  const connect = () => {
    // Don't connect if already connected or connecting
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return
    }

    ws = new WebSocket(url)

    ws.onopen = () => {
      isConnected.value = true
      ws?.send(JSON.stringify({ op: 'subscribe', args: [topic] }))
      console.log('[WebSocket connected]', topic)
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.topic?.startsWith(topic.split(':')[0])) {
        onMessage(msg.data)
      }
    }

    ws.onerror = (err) => {
      isConnected.value = false
      console.error('[WebSocket error]', err)
    }

    ws.onclose = () => {
      isConnected.value = false
    }
  }

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