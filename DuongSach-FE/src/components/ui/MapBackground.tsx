interface MapBackgroundProps {
  src?: string;
  alt: string;
}

// Share one coordinate frame across admin, partner and public map views.
export function MapBackground({ src, alt }: MapBackgroundProps) {
  return <img src={src} alt={alt} draggable={false} style={{
    width: '100%', height: 'auto', aspectRatio: '16 / 9',
    objectFit: 'contain', objectPosition: 'center', background: '#E8E0D2',
    display: 'block', userSelect: 'none',
  }} />;
}
