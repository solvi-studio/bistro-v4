interface FeatureCardProps {
  title: React.ReactNode;
  image: React.ReactNode;
  caption: React.ReactNode;
  captionColor?: string;
  bgColor?: string;
  rotation?: number;
}

export function FeatureCard({
  title,
  image,
  caption,
  captionColor = "#F4756A",
  bgColor = "#FFF9E6",
  rotation = 0,
}: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 max-w-[220px]">
      <h3 className="text-center text-[15px] text-gray-800 leading-snug font-poppins font-[500]">
        {title}
      </h3>

      <div
        className="relative w-[200px] h-[260px] rounded-2xl flex items-center justify-center rotate-(--rotation)"
        style={
          {
            backgroundColor: bgColor,
            "--rotation": `${rotation}deg`,
          } as React.CSSProperties
        }
      >
        {image}
      </div>

      <p
        className="text-center text-xs font-poppins font-[500] leading-relaxed"
        style={{ color: captionColor }}
      >
        {caption}
      </p>
    </div>
  );
}
