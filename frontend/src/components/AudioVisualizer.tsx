interface AudioVisualizerProps {
  level: number;
  isActive: boolean;
}

export default function AudioVisualizer({ level, isActive }: AudioVisualizerProps) {
  const bars = 20;
  const barHeights = Array.from({ length: bars }, (_, i) => {
    const distance = Math.abs(i - bars / 2) / (bars / 2);
    const baseHeight = isActive ? level * 100 : 0;
    return Math.max(5, baseHeight * (1 - distance * 0.5));
  });

  return (
    <div className="relative w-full h-32 bg-gradient-to-br from-fun-purple/10 via-fun-pink/10 to-fun-yellow/10 rounded-lg overflow-hidden">
      {/* Background waveform image */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(/assets/generated/waveform-background.dim_800x200.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Animated bars */}
      <div className="relative h-full flex items-center justify-center gap-1 px-4">
        {barHeights.map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-full transition-all duration-100 ease-out"
            style={{
              height: `${height}%`,
              backgroundColor: isActive
                ? `oklch(${0.6 + level * 0.2} 0.28 ${280 + index * 5})`
                : 'oklch(0.5 0.1 280)',
              opacity: isActive ? 0.8 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Status indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fun-pink animate-pulse" />
          <span className="text-xs font-medium text-fun-pink">Recording</span>
        </div>
      )}
    </div>
  );
}
