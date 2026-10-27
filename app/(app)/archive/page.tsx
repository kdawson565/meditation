import { Suspense } from "react";
import ArchiveView from "./ArchiveView";

export default function ArchivePage() {
  return (
    <Suspense fallback={<div aria-busy="true" />}>
      <ArchiveView />
    </Suspense>
  );
}
