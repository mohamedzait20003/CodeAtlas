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
  RESUME_ANALYST_PROMPT,
  REPO_ANALYST_PROMPT,
  PLANNER_PROMPT,
  WRITER_PROMPT,
  REVIEWER_PROMPT,
  resumeAnalystInput,
  repoAnalystInput,
  plannerInput,
  writerInput,
  reviewerInput,
} from '../context/profile.prompts';
import type { ProfileContext } from '../context/profile-context';

const MAX_REVISIONS = 2;

export interface AgentInput {
  context: ProfileContext;
  intent: string | null;
  provider: LlmProvider;
  modelId: string;
  onPhase?: (phase: string) => Promise<void>;
}

export interface AgentResult {
  markdown: string;
  inputTokens: number;
  outputTokens: number;
}

/** LangGraph state for the profile flow. */
const ProfileState = Annotation.Root({
  context: Annotation<ProfileContext>(),
  intent: Annotation<string | null>(),
  resumeProfile: Annotation<string>(),
  repoProfile: Annotation<string>(),
  plan: Annotation<string>(),
  draft: Annotation<string>(),
  critique: Annotation<string>(),
  revisions: Annotation<number>(),
  approved: Annotation<boolean>(),
});

type ProfileStateType = typeof ProfileState.State;

/**
 * The "Compose Your Profile" agent: a LangGraph state machine that analyzes the
 * sources, plans, drafts, and self-critiques the profile README (bounded revise
 * loop), on the provider/model resolved from the user's plan/selection.
 *
 *   ┌ résumé-analyst ┐
 *   │                ├─▶ analyze → draft → review ──(revise, ≤MAX)──▶ draft
 *   └ repo-analyst  ─┘                         └───────(approve)──────▶ END
 *
 * The two analysts run in parallel (fan-out from START) and fan in to the planner.
 */
@Injectable()
export class ProfileReadmeAgentService {
  constructor(private readonly factory: LlmProviderFactory) {}

  async run(input: AgentInput): Promise<AgentResult> {
    const model = this.factory.forModel(input.provider, input.modelId);
    const usage = { input: 0, output: 0 };

    const call = async (messages: BaseMessage[]): Promise<string> => {
      const res = await model.invoke(messages);
      usage.input += res.usage_metadata?.input_tokens ?? 0;
      usage.output += res.usage_metadata?.output_tokens ?? 0;
      return textOf(res);
    };

    const resumeAnalyst = async (
      s: ProfileStateType,
    ): Promise<Partial<ProfileStateType>> => {
      await input.onPhase?.('analyzing');
      return {
        resumeProfile: await call([
          new SystemMessage(RESUME_ANALYST_PROMPT),
          new HumanMessage(resumeAnalystInput(s.context)),
        ]),
      };
    };

    const repoAnalyst = async (
      s: ProfileStateType,
    ): Promise<Partial<ProfileStateType>> => {
      await input.onPhase?.('analyzing');
      return {
        repoProfile: await call([
          new SystemMessage(REPO_ANALYST_PROMPT),
          new HumanMessage(repoAnalystInput(s.context)),
        ]),
      };
    };

    const analyze = async (
      s: ProfileStateType,
    ): Promise<Partial<ProfileStateType>> => {
      await input.onPhase?.('analyzing');
      return {
        plan: await call([
          new SystemMessage(PLANNER_PROMPT),
          new HumanMessage(
            plannerInput(s.context, s.intent, s.resumeProfile, s.repoProfile),
          ),
        ]),
      };
    };

    const draft = async (
      s: ProfileStateType,
    ): Promise<Partial<ProfileStateType>> => {
      await input.onPhase?.('drafting');
      return {
        draft: await call([
          new SystemMessage(WRITER_PROMPT),
          new HumanMessage(
            writerInput(
              s.context,
              s.intent,
              s.plan,
              s.critique,
              s.resumeProfile,
              s.repoProfile,
            ),
          ),
        ]),
        revisions: s.revisions + 1,
      };
    };

    const critique = async (
      s: ProfileStateType,
    ): Promise<Partial<ProfileStateType>> => {
      await input.onPhase?.('reviewing');
      const text = await call([
        new SystemMessage(REVIEWER_PROMPT),
        new HumanMessage(reviewerInput(s.context, s.plan, s.draft)),
      ]);
      return { critique: text, approved: /\bAPPROVED\b/i.test(text) };
    };

    // Node names must differ from state channels (draft/critique) — LangGraph rule.
    const route = (s: ProfileStateType): 'write' | typeof END =>
      s.approved || s.revisions >= MAX_REVISIONS ? END : 'write';

    const graph = new StateGraph(ProfileState)
      .addNode('resume', resumeAnalyst)
      .addNode('repos', repoAnalyst)
      .addNode('analyze', analyze)
      .addNode('write', draft)
      .addNode('review', critique)
      .addEdge(START, 'resume')
      .addEdge(START, 'repos')
      .addEdge('resume', 'analyze')
      .addEdge('repos', 'analyze')
      .addEdge('analyze', 'write')
      .addEdge('write', 'review')
      .addConditionalEdges('review', route)
      .compile();

    const final = await graph.invoke({
      context: input.context,
      intent: input.intent,
      resumeProfile: '',
      repoProfile: '',
      plan: '',
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

/** README text out of an AI message (Gemini returns a string; guard the union). */
function textOf(msg: AIMessage): string {
  const content = msg.content;
  if (typeof content === 'string') return content;
  return content
    .map((part) =>
      typeof part === 'string' ? part : 'text' in part ? part.text : '',
    )
    .join('');
}
