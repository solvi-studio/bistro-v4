import Sidebar from "@/components/canvas/Sidebar";

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-[#1a1a1a] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
