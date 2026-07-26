import { Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';

import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import { LlmProviderFactory } from '@/shared/Factories/llm-provider.factory';
import {
  REPO_WRITER_PROMPT,
  REPO_REVIEWER_PROMPT,
  repoWriterInput,
  repoReviewerInput,
} from '../context/repo.prompts';
import type { RepoReadmeContext } from '../context/repo-context';

const MAX_REVISIONS = 2;

export interface RepoAgentInput {
  context: RepoReadmeContext;
  intent: string | null;
  provider: LlmProvider;
  modelId: string;
  onPhase?: (phase: string) => Promise<void>;
}

export interface RepoAgentResult {
  markdown: string;
  inputTokens: number;
  outputTokens: number;
}

/** LangGraph state for the repo-README flow. */
const RepoState = Annotation.Root({
  context: Annotation<RepoReadmeContext>(),
  intent: Annotation<string | null>(),
  draft: Annotation<string>(),
  critique: Annotation<string>(),
  revisions: Annotation<number>(),
  approved: Annotation<boolean>(),
});

type RepoStateType = typeof RepoState.State;

/**
 * The "Compose a README" agent: a focused write → review loop (bounded revise)
 * that generates one repository's README from its content, on the provider/model
 * resolved from the user's plan/selection.
 *
 *   write → review ──(revise, ≤MAX)──▶ write
 *              └────────(approve)──────▶ END
 */
@Injectable()
export class RepoReadmeAgentService {
  constructor(private readonly factory: LlmProviderFactory) {}

  async run(input: RepoAgentInput): Promise<RepoAgentResult> {
    const model = this.factory.forModel(input.provider, input.modelId);
    const usage = { input: 0, output: 0 };

    const call = async (messages: BaseMessage[]): Promise<string> => {
      const res = await model.invoke(messages);
      usage.input += res.usage_metadata?.input_tokens ?? 0;
      usage.output += res.usage_metadata?.output_tokens ?? 0;
      return textOf(res);
    };

    const write = async (s: RepoStateType): Promise<Partial<RepoStateType>> => {
      await input.onPhase?.('drafting');
      return {
        draft: await call([
          new SystemMessage(REPO_WRITER_PROMPT),
          new HumanMessage(repoWriterInput(s.context, s.intent, s.critique)),
        ]),
        revisions: s.revisions + 1,
      };
    };

    const review = async (
      s: RepoStateType,
    ): Promise<Partial<RepoStateType>> => {
      await input.onPhase?.('reviewing');
      const text = await call([
        new SystemMessage(REPO_REVIEWER_PROMPT),
        new HumanMessage(repoReviewerInput(s.context, s.draft)),
      ]);
      return { critique: text, approved: /\bAPPROVED\b/i.test(text) };
    };

    const route = (s: RepoStateType): 'write' | typeof END =>
      s.approved || s.revisions >= MAX_REVISIONS ? END : 'write';

    const graph = new StateGraph(RepoState)
      .addNode('write', write)
      .addNode('review', review)
      .addEdge(START, 'write')
      .addEdge('write', 'review')
      .addConditionalEdges('review', route)
      .compile();

    const final = await graph.invoke({
      context: input.context,
      intent: input.intent,
      draft: '',
      critique: '',
      revisions: 0,
      approved: false,
    });

    return {
      markdown: (final.draft ?? '').trim(),
      inputTokens: usage.input,
      outputTokens: usage.output,
    };
  }
}

/** README text out of an AI message (guard the string|parts union). */
function textOf(msg: AIMessage): string {
  const content = msg.content;
  if (typeof content === 'string') return content;
  return content
    .map((part) =>
      typeof part === 'string' ? part : 'text' in part ? part.text : '',
    )
    .join('');
}
