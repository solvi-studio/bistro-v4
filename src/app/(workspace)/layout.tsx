import Sidebar from "@/components/canvas/Sidebar";
import CreativeHelperSidebar from "@/components/creative/CreativeHelperSidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#1a1a1a]">
      <Sidebar />

      <CreativeHelperSidebar />
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
