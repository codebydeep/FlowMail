import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useEmailStore } from '@/store/emailStore'
import toast from 'react-hot-toast'

export function useRealtimeNotifications(userId?: number) {
  const clientRef = useRef<Client | null>(null)
  const addEmail = useEmailStore((s) => s.addEmail)

  useEffect(() => {
    if (!userId) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WS] Connected')

        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          try {
            const notification = JSON.parse(message.body)

            if (notification.type === 'NEW_EMAIL') {
              const email = notification.payload
              addEmail({
                id: email.emailId,
                senderEmail: email.senderEmail,
                senderName: email.senderEmail,
                subject: email.subject,
                snippet: '',
                receivedAt: email.receivedAt,
                read: false,
                starred: false,
              })

              toast(`📧 ${email.senderEmail}: ${email.subject}`, {
                duration: 4000,
              })
            }
          } catch (e) {
            console.warn('[WS] Failed to parse notification', e)
          }
        })
      },
      onDisconnect: () => console.log('[WS] Disconnected'),
      onStompError: (frame) => console.error('[WS] STOMP error', frame),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [userId, addEmail])
}
