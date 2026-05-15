interface Props {
  url?: string;
  alt?: string;
}

export default function StoryboardCell({ url, alt = "Storyboard" }: Props) {
  if (url) {
    return (
      <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="w-20 h-16 rounded-xl bg-gray-100 shrink-0"
      aria-label="Storyboard placeholder"
    />
  );
}
