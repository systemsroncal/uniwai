import { Suspense } from "react";
import { CircularProgress, Stack } from "@mui/material";
import { InboxPanel } from "@/src/components/crm/inbox-panel";
import { ModulePage } from "@/src/components/crm/module-page";

export default function InboxPage() {
  return (
    <ModulePage>
    <Suspense
      fallback={
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      }
    >
      <InboxPanel />
    </Suspense>
    </ModulePage>
  );
}
