"use client";

const STEPS = [
  {
    title: "Brainstorm with MindMap",
    desc: "Free flow chunking anything you have in mind to create story",
    color: "#ef9aa0",
  },
  {
    title: "Summarise Ideas",
    desc: "Turn your messy whiteboard into a clean, clustered table shotlist",
    color: "#7ba4e8",
  },
  {
    title: "Arrange Your Post Schedule",
    desc: "Get your content ready to be published",
    color: "#e6b94f",
  },
];

export default function CreativeFlowReminder() {
  return (
    <div className="rounded-2xl bg-[#f3f3f4] p-5">
      <h3 className="mb-4 text-sm font-bold text-gray-800">
        Your Creative Flow Reminder
      </h3>
      <div className="flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: step.color }}
            >
              {i + 1}
            </span>
            <div>
              <p className="text-xs font-bold text-gray-800">{step.title}</p>
              <p className="mt-0.5 text-[11px] italic leading-snug text-gray-400">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
