import { PageIntro } from "@/modules/client/components/PageIntro";
import { RepoGenerateList } from "../sections/projects/RepoGenerateList";

/** Dedicated "Compose a README" page — pick a repo, steer it, review, commit. */
export default function ProjectCompose() {
  return (
    <div className="space-y-6">
      <PageIntro
        title="Compose a README"
        description="Generate a polished README for any of your repositories — grounded in the real code, reviewed and committed on your terms."
      />
      <RepoGenerateList />
    </div>
  );
}
