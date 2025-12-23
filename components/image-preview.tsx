interface ImagePreviewProps {
  src: string
  alt: string
}

export default function ImagePreview({ src, alt }: ImagePreviewProps) {
  return (
    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
      <img src={src || "/placeholder.svg"} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}
