import { baseApi } from "../api/baseApi";
import type {
  CommitResponse,
  CompositionResponse,
  CompositionStartResponse,
  ProfileBrief,
  TailorResponse,
} from "../models/compositionModel";

/** Start a "Compose Your Profile" job. Model defaults to the plan's; brief steers it. */
export async function startComposition(
  brief?: ProfileBrief,
  modelId?: string,
): Promise<CompositionStartResponse> {
  const res = await baseApi.post<CompositionStartResponse>("/compositions", {
    brief,
    modelId: modelId || undefined,
  });
  return res.data;
}

export async function getComposition(id: string): Promise<CompositionResponse> {
  const res = await baseApi.get<CompositionResponse>(`/compositions/${id}`);
  return res.data;
}

/** Sharpen a rough intent note with a cheap model (synchronous). */
export async function tailorIntent(draft: string): Promise<TailorResponse> {
  const res = await baseApi.post<TailorResponse>("/compositions/tailor", {
    draft,
  });
  return res.data;
}

/** Push the edited README straight to the user's profile repo. */
export async function commitComposition(
  id: string,
  content: string,
): Promise<CommitResponse> {
  const res = await baseApi.post<CommitResponse>(`/compositions/${id}/commit`, {
    content,
  });
  return res.data;
}
