import { useState, type ImgHTMLAttributes } from 'react'
import { fallback } from '../../data/images'

interface ImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  /** Stable seed so the fallback for a given image is always the same picture. */
  seed?: string
}

/**
 * Image with a guaranteed fallback. The Stitch exports shipped expiring CDN
 * URLs; this makes a broken image impossible regardless of the source.
 */
export function Img({ src, alt, seed, className, ...rest }: ImgProps) {
  const [current, setCurrent] = useState(src)
  const [failed, setFailed] = useState(false)

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (failed) return
        setFailed(true)
        setCurrent(fallback(seed ?? alt ?? src))
      }}
    />
  )
}
