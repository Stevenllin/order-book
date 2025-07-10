// composables/useBTSESocket.ts
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface BTSESocketOptions {
  url: string
  topic: string
  onMessage: (data: any) => void
}

export function useBTSESocket({ url, topic, onMessage }: BTSESocketOptions) {
  const isConnected = ref(false)
  let ws: WebSocket | null = null

  const connect = () => {
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
      console.error('[WebSocket error]', err)
    }
  }

  const disconnect = () => {
    ws?.close()
    isConnected.value = false
  }

  onMounted(() => {
    connect()
  })

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    isConnected,
    connect,
    disconnect,
  }
}