import { baseApi } from "../api/baseApi";
import type { ReposResponse } from "../models/repoModel";
import type {
  CommitResponse,
  CompositionResponse,
  CompositionStartResponse,
  RepoBrief,
} from "../models/compositionModel";

export async function getRepos(
  page: number,
  pageSize: number,
): Promise<ReposResponse> {
  const res = await baseApi.get<ReposResponse>("/repos", {
    params: { page, pageSize },
  });
  return res.data;
}

/** Start a "Compose a README" job for one repo (id = its GitHub repo id). */
export async function startRepoGeneration(
  repoId: string,
  brief?: RepoBrief,
  modelId?: string,
): Promise<CompositionStartResponse> {
  const res = await baseApi.post<CompositionStartResponse>(
    `/repos/${repoId}/generate`,
    { brief, modelId: modelId || undefined },
  );
  return res.data;
}

export async function getRepoGeneration(
  id: string,
): Promise<CompositionResponse> {
  const res = await baseApi.get<CompositionResponse>(`/repos/generations/${id}`);
  return res.data;
}

/** Push the edited README straight to the target repo's default branch. */
export async function commitRepoGeneration(
  id: string,
  content: string,
): Promise<CommitResponse> {
  const res = await baseApi.post<CommitResponse>(
    `/repos/generations/${id}/commit`,
    { content },
  );
  return res.data;
}
