"use client";

import { useParams } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { FormPageSkeleton } from "@/components/loading";
import { useApplication } from "@/lib/hooks";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const query = useApplication(params.id);

  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        {query.error instanceof Error
          ? query.error.message
          : "Failed to load"}
      </p>
    );
  }

  if (query.isLoading || !query.data) {
    return <FormPageSkeleton />;
  }

  return (
    <ApplicationForm
      application={query.data.application}
      workflow={query.data.workflow}
    />
  );
}
