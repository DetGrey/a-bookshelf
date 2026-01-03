import { useEffect, useMemo, useRef, useState } from 'react'

function hashHue(text = '') {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0 // keep 32-bit int
  }
  return Math.abs(hash) % 360
}

function CoverImage({ src, title, alt, className = '', style = {}, lazy = true }) {
  const holderRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const [errored, setErrored] = useState(false)
  const label = title || alt || 'No cover'
  const hue = useMemo(() => hashHue(label), [label])
  const fallbackStyle = {
    background: `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${(hue + 30) % 360} 60% 45%))`,
    ...style,
  }

  useEffect(() => {
    if (!lazy || shouldLoad) return
    const el = holderRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      })
    }, { rootMargin: '120px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [lazy, shouldLoad])

  const showImage = shouldLoad && src && !errored

  return (
    <span ref={holderRef} style={{ display: 'inline-block' }}>
      {showImage ? (
        <img
          className={`cover-image ${className}`}
          src={src}
          alt={alt || title || 'Cover image'}
          onError={() => setErrored(true)}
          style={style}
          loading="lazy"
        />
      ) : (
        <div className={`cover-fallback ${className}`} style={fallbackStyle}>
          <span>{label}</span>
        </div>
      )}
    </span>
  )
}

export default CoverImage
