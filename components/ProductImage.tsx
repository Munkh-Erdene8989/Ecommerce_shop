import Image, { ImageProps } from 'next/image'

const PLACEHOLDER_HOST = 'via.placeholder.com'
const PLACEHOLDER_FALLBACK_HOST = 'placehold.co'

/**
 * Next/Image wrapper: via.placeholder.com зургуудыг unoptimized-ээр ачаална.
 * Vercel Image Optimization эдгээр гадаад URL-д 502 өгдөг тул шууд ачаална.
 * Мөн via.placeholder.com DNS асуудалтай үед placehold.co руу fallback хийнэ.
 */
export default function ProductImage({ src, ...props }: ImageProps) {
  const srcStr = typeof src === 'string' ? src : (src as { src: string })?.src ?? ''
  const isPlaceholder =
    srcStr.includes(PLACEHOLDER_HOST) || srcStr.startsWith('https://via.placeholder.com')

  const finalSrc =
    isPlaceholder && srcStr
      ? srcStr.replace('https://via.placeholder.com', `https://${PLACEHOLDER_FALLBACK_HOST}`)
      : src

  return <Image src={finalSrc} unoptimized={isPlaceholder} {...props} />
}
