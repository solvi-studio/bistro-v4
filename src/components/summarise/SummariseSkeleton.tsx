export default function SummariseSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header project tag */}
      <div className="px-8 pt-7 pb-4 border-b border-gray-100">
        <div className="animate-shimmer h-8 w-36 rounded-full mb-5" />
        <div className="flex gap-8">
          {[120, 80, 100].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="animate-shimmer h-4 rounded"
                style={{ width: w, animationDelay: `${i * 80}ms` }}
              />
              <div
                className="animate-shimmer h-4 w-24 rounded"
                style={{ animationDelay: `${i * 80 + 40}ms` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="px-8 py-4 grid grid-cols-[80px_100px_1fr_120px_120px_1fr] gap-4 border-b border-gray-100">
        {[
          "Shot Number",
          "Storyboard",
          "Description",
          "Shooting Style",
          "Camera Angle",
          "Script",
        ].map((col, i) => (
          <div
            key={col}
            className="animate-shimmer h-4 rounded"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Table rows */}
      <div className="flex-1 overflow-y-auto px-8">
        {Array.from({ length: 4 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid grid-cols-[80px_100px_1fr_120px_120px_1fr] gap-4 py-5 border-b border-gray-50"
            style={{ animationDelay: `${rowIdx * 100}ms` }}
          >
            <div className="animate-shimmer h-4 w-8 rounded mx-auto" />
            <div
              className="animate-shimmer h-16 w-20 rounded-xl"
              style={{ animationDelay: `${rowIdx * 100 + 30}ms` }}
            />
            <div className="flex flex-col gap-2">
              {[100, 80, 90, 60].map((w, i) => (
                <div
                  key={i}
                  className="animate-shimmer h-3 rounded"
                  style={{
                    width: `${w}%`,
                    animationDelay: `${rowIdx * 100 + i * 20}ms`,
                  }}
                />
              ))}
            </div>
            <div
              className="animate-shimmer h-4 w-20 rounded mx-auto"
              style={{ animationDelay: `${rowIdx * 100 + 50}ms` }}
            />
            <div
              className="animate-shimmer h-4 w-20 rounded mx-auto"
              style={{ animationDelay: `${rowIdx * 100 + 70}ms` }}
            />
            <div className="flex flex-col gap-2">
              {[85, 70, 90].map((w, i) => (
                <div
                  key={i}
                  className="animate-shimmer h-3 rounded"
                  style={{
                    width: `${w}%`,
                    animationDelay: `${rowIdx * 100 + i * 20 + 60}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 flex justify-between border-t border-gray-100">
        <div className="animate-shimmer h-10 w-36 rounded-full" />
        <div className="animate-shimmer h-10 w-28 rounded-full" />
      </div>
    </div>
  );
}
