import { Workspace } from "@/app/dashboard/workspace";
import type { AppRole } from "@/lib/types";

const previewRoles: AppRole[] = ["admin", "teacher", "homeroom_teacher", "student", "parent"];

export default function GuestPage() {
  return (
    <Workspace
      initialRoles={previewRoles}
      initialRole="admin"
      demoMode
      readOnly
      profileName="Guest"
    />
  );
}
