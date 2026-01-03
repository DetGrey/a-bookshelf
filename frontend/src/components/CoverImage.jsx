import { useMemo, useState } from 'react'

function hashHue(text = '') {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0 // keep 32-bit int
  }
  return Math.abs(hash) % 360
}

function CoverImage({ src, title, alt, className = '', style = {} }) {
  const [errored, setErrored] = useState(!src)
  const label = title || alt || 'No cover'
  const hue = useMemo(() => hashHue(label), [label])
  const fallbackStyle = {
    background: `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${(hue + 30) % 360} 60% 45%))`,
    ...style,
  }

  if (errored || !src) {
    return (
      <div className={`cover-fallback ${className}`} style={fallbackStyle}>
        <span>{label}</span>
      </div>
    )
  }

  return (
    <img
      className={`cover-image ${className}`}
      src={src}
      alt={alt || title || 'Cover image'}
      onError={() => setErrored(true)}
      style={style}
      loading="lazy"
    />
  )
}

export default CoverImage
