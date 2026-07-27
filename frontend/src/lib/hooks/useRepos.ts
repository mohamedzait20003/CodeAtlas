import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getRepos } from "@/lib/handlers/projectHandlers";

/**
 * Paged list of the user's GitHub repositories. `keepPreviousData` keeps the
 * current page visible while the next loads (no flash of empty state), and the
 * query cache (60s) plus the backend's per-user cache make paging snappy.
 */
export function useRepos(page: number, pageSize = 12) {
  return useQuery({
    queryKey: ["repos", page, pageSize],
    queryFn: () => getRepos(page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    select: (res) => res.Data,
  });
}
