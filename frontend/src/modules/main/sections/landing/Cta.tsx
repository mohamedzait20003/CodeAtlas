import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { Button } from "@/common/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <FileText className="mx-auto mb-4 h-10 w-10 text-violet-500 opacity-80" />
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Ready to compose your code?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Join developers who ship READMEs they're actually proud of.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 gap-2 bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700"
        >
          <Link to="/auth/sign-up">
            <FaGithub className="h-4 w-4" />
            Get started for free
          </Link>
        </Button>
      </div>
    </section>
  );
}
