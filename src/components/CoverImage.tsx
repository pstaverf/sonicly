interface CoverImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

const withExtension = (src: string, extension: string) => src.replace(/\.jpg$/i, extension)

export const CoverImage = ({
  src,
  alt,
  className,
  width = 320,
  height = 320,
  priority = false,
}: CoverImageProps) => (
  <picture>
    <source type="image/avif" srcSet={withExtension(src, '.avif')} />
    <source type="image/webp" srcSet={withExtension(src, '.webp')} />
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  </picture>
)
