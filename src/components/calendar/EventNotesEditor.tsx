"use client";

interface Props {
  notes: string;
  onChange: (notes: string) => void;
}

export default function EventNotesEditor({ notes, onChange }: Props) {
  return (
    <textarea
      value={notes}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add notes…"
      rows={4}
      className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-primary"
    />
  );
}
