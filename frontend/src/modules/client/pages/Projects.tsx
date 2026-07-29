import { PageIntro } from "@/modules/client/components/PageIntro";
import { RepoGallery } from "../sections/projects/RepoGallery";

/** GitHub projects browser — pick a repo to compose its README. */
export default function Projects() {
  return (
    <div className="space-y-6">
      <PageIntro
        title="Your projects"
        description="Your GitHub repositories. Pick one to compose or refresh its README."
      />
      <RepoGallery />
    </div>
  );
}
