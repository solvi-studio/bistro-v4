import { storage } from "@/utils/storage";

// Scoped per Clerk user id — never a bare global key — so folder-visit
// history can't leak between accounts signed in on the same shared
// browser/machine. Sidebar.tsx also clears the current user's entry on
// sign-out as a belt-and-braces cleanup.
const keyFor = (userId: string) => `bistro_last_opened_folder_${userId}`;

export function recordFolderOpened(userId: string, clientId: string): void {
  storage.write(keyFor(userId), clientId);
}

export function getLastOpenedFolder(userId: string): string | null {
  return storage.read<string | null>(keyFor(userId), null);
}

export function clearLastOpenedFolder(userId: string): void {
  storage.remove(keyFor(userId));
}
