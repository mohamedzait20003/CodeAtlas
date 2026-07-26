import { PageIntro } from "@/modules/client/components/PageIntro";
import { ComposeBanner } from "../sections/projects/ComposeBanner";
import { RepoGenerateList } from "../sections/projects/RepoGenerateList";
import { GenerationsTable } from "../sections/generations/GenerationsTable";
import { placeholderGenerations } from "../placeholder";

export default function Projects() {
  return (
    <div className="space-y-6">
      <PageIntro
        title="Projects"
        description="Generate a README for any repository, or compose your whole profile."
      />

      <ComposeBanner />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Your repositories
        </h2>
        <RepoGenerateList />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Recent generations
        </h2>
        <GenerationsTable items={placeholderGenerations} />
      </section>
    </div>
  );
}
