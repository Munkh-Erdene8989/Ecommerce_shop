import Image, { ImageProps } from 'next/image'

const PLACEHOLDER_HOST = 'via.placeholder.com'

/**
 * Next/Image wrapper: via.placeholder.com зургуудыг unoptimized-ээр ачаална.
 * Vercel Image Optimization эдгээр гадаад URL-д 502 өгдөг тул шууд ачаална.
 */
export default function ProductImage({ src, ...props }: ImageProps) {
  const srcStr = typeof src === 'string' ? src : (src as { src: string })?.src ?? ''
  const isPlaceholder =
    srcStr.includes(PLACEHOLDER_HOST) || srcStr.startsWith('https://via.placeholder.com')

  return <Image src={src} unoptimized={isPlaceholder} {...props} />
}
