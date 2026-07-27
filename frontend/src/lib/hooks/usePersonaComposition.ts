import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  commitComposition,
  getComposition,
  startComposition,
  tailorIntent,
} from "@/lib/handlers/personaHandlers";
import type { ProfileBrief } from "@/lib/models/personaModel";

/** Polls a persona composition until it reaches a terminal state. */
export function usePersonaComposition(id: string | null) {
  return useQuery({
    queryKey: ["persona-composition", id],
    queryFn: () => getComposition(id as string),
    enabled: Boolean(id),
    select: (res) => res.Data,
    refetchInterval: (query) => {
      const status = query.state.data?.Data?.Status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
}

export function useStartPersonaComposition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { brief?: ProfileBrief; modelId?: string }) =>
      startComposition(vars.brief, vars.modelId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useTailorIntent() {
  return useMutation({ mutationFn: (draft: string) => tailorIntent(draft) });
}

export function useCommitPersonaComposition() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commitComposition(id, content),
  });
}
