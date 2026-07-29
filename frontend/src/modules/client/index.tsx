import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "@/root";
import useAuthGuard from "@/lib/guards/authGuard";
import useRoleGuard from "@/lib/guards/roleGuard";

import Overview from "./pages/Overview";
import Projects from "./pages/Projects";
import ProjectCompose from "./pages/ProjectCompose";
import PersonaCompose from "./pages/PersonaCompose";

/**
 * Customer dashboard at /customer/$name/* (Overview + Projects), for an
 * authenticated `user`. Profile routes live in the profile module. Guards run in
 * beforeLoad; ssr:false so they read the hydrated client store.
 */
const guard = () => {
  useAuthGuard();
  useRoleGuard("user");
};

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer/$name",
  component: Overview,
  beforeLoad: guard,
  ssr: false,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer/$name/projects",
  component: Projects,
  beforeLoad: guard,
  ssr: false,
});

const projectComposeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer/$name/projects/$repoId",
  component: ProjectCompose,
  beforeLoad: guard,
  ssr: false,
});

const composeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer/$name/compose",
  component: PersonaCompose,
  beforeLoad: guard,
  ssr: false,
});

export const clientRoutes = [
  overviewRoute,
  projectsRoute,
  projectComposeRoute,
  composeRoute,
];
