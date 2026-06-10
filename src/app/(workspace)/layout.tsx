import Sidebar from "@/components/canvas/Sidebar";
import WorkspaceShell from "@/components/creative/WorkspaceShell";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#1a1a1a]">
      <Sidebar />
      <WorkspaceShell>{children}</WorkspaceShell>
    </div>
  );
}
