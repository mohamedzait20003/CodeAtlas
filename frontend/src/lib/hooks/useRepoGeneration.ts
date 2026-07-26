import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  commitRepoGeneration,
  getRepoGeneration,
  startRepoGeneration,
} from "@/lib/handlers/repoHandlers";
import type { RepoBrief } from "@/lib/models/compositionModel";

/** Polls a repo-README generation until it reaches a terminal state. */
export function useRepoGeneration(id: string | null) {
  return useQuery({
    queryKey: ["repo-generation", id],
    queryFn: () => getRepoGeneration(id as string),
    enabled: Boolean(id),
    select: (res) => res.Data,
    refetchInterval: (query) => {
      const status = query.state.data?.Data?.Status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
}

export function useStartRepoGeneration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { repoId: string; brief?: RepoBrief; modelId?: string }) =>
      startRepoGeneration(vars.repoId, vars.brief, vars.modelId),
    onSuccess: () => {
      // Usage (repo-generation quota) may have changed.
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCommitRepoGeneration() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commitRepoGeneration(id, content),
  });
}
