'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { useAgeGroupsQuery } from "../hooks/useAgeGroups";

export default function AgeGroupCheckBox() {
  const { data, isLoading, isPending, isError, error } = useAgeGroupsQuery()

  if (isLoading && isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  console.log("age group data: ", data);


  return <div>

  </div>
}
