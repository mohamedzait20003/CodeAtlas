import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  commitComposition,
  getComposition,
  startComposition,
  tailorIntent,
} from "@/lib/handlers/compositionHandlers";
import type { ProfileBrief } from "@/lib/models/compositionModel";

/** Polls a composition until it reaches a terminal state (completed / failed). */
export function useComposition(id: string | null) {
  return useQuery({
    queryKey: ["composition", id],
    queryFn: () => getComposition(id as string),
    enabled: Boolean(id),
    select: (res) => res.Data,
    refetchInterval: (query) => {
      const status = query.state.data?.Data?.Status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
}

export function useStartComposition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { brief?: ProfileBrief; modelId?: string }) => startComposition(vars.brief, vars.modelId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useTailorIntent() {
  return useMutation({ mutationFn: (draft: string) => tailorIntent(draft) });
}

export function useCommitComposition() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commitComposition(id, content),
  });
}
