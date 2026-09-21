import { useEffect, useRef } from 'react'

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function TurnstileWidget({ onToken }) {
  const container = useRef(null)
  const widget = useRef(null)

  useEffect(() => {
    if (!siteKey) return undefined
    let cancelled = false

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !container.current || widget.current !== null) return
      widget.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    }

    const existingScript = document.querySelector('script[data-turnstile-script]')
    if (existingScript) {
      existingScript.addEventListener('load', renderWidget, { once: true })
      renderWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstileScript = 'true'
      script.addEventListener('load', renderWidget, { once: true })
      document.head.appendChild(script)
    }

    return () => { cancelled = true }
  }, [onToken])

  if (!siteKey) return null
  return <div className="turnstile-widget" ref={container} />
}
