import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  commitRepoGeneration,
  getRepoGeneration,
  startRepoGeneration,
} from "@/lib/handlers/projectHandlers";
import type { RepoBrief } from "@/lib/models/projectModel";

/** Polls a project composition until it reaches a terminal state. */
export function useProjectComposition(id: string | null) {
  return useQuery({
    queryKey: ["project-composition", id],
    queryFn: () => getRepoGeneration(id as string),
    enabled: Boolean(id),
    select: (res) => res.Data,
    refetchInterval: (query) => {
      const status = query.state.data?.Data?.Status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
}

export function useStartProjectComposition() {
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

export function useCommitProjectComposition() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commitRepoGeneration(id, content),
  });
}
