import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, Menu, X, BookOpen, LogOut } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

import { useStore } from "@/store";
import { cn } from "@/lib/utils/utils";
import { useLogout } from "@/lib/hooks/useUser";
import { accountSlug } from "@/lib/auth/account";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";

const MARKETING_NAV = [
  { label: "Plans", to: "/plans" },
  { label: "About", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Contact", to: "/contact" },
] as const;

/** Client dashboard sections shown when on a /customer route. */
type CustomerNavItem = {
  label: string;
  to:
    | "/customer/$name"
    | "/customer/$name/compose"
    | "/customer/$name/projects";
  exact?: boolean;
};

const CUSTOMER_NAV: CustomerNavItem[] = [
  { label: "Overview", to: "/customer/$name", exact: true },
  { label: "Compose", to: "/customer/$name/compose" },
  { label: "Projects", to: "/customer/$name/projects" },
];

function initials(name: string | null, login: string | null): string {
  const base = name?.trim() || login?.trim() || "";
  if (!base) return "U";
  const parts = base.split(/\s+/);
  return (
    parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2)
  ).toUpperCase();
}

export function Navbar() {
  const { mode, toggleMode, isAuthenticated, userData } = useStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const navigate = useNavigate();
  const logout = useLogout();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Auth-dependent UI only after mount, to avoid an SSR/hydration mismatch.
  const authed = mounted && isAuthenticated;
  const slug = accountSlug(userData?.name);
  const onCustomer = pathname.startsWith("/customer");

  const marketingActive = (to: string) => pathname.startsWith(to);
  const customerActive = (to: string, exact?: boolean) => {
    const resolved = to.replace("$name", slug);
    return exact ? pathname === resolved : pathname.startsWith(resolved);
  };

  const linkBase = (active: boolean) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-violet-50 text-violet-600 dark:bg-violet-950/40"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const signOut = () => {
    setOpen(false);
    logout.mutate(undefined, { onSettled: () => void navigate({ to: "/" }) });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {authed ? (
          <Link
            to="/customer/$name"
            params={{ name: slug }}
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <BookOpen className="h-4 w-4 text-white" />
            </span>
            <span className="text-base">
              Code<span className="text-violet-600">Atlas</span>
            </span>
          </Link>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <BookOpen className="h-4 w-4 text-white" />
            </span>
            <span className="text-base">
              Code<span className="text-violet-600">Atlas</span>
            </span>
          </Link>
        )}

        <nav className="hidden items-center gap-1 md:flex">
          {onCustomer
            ? CUSTOMER_NAV.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  params={{ name: slug }}
                  className={linkBase(customerActive(l.to, l.exact))}
                >
                  {l.label}
                </Link>
              ))
            : MARKETING_NAV.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={linkBase(marketingActive(l.to))}
                >
                  {l.label}
                </Link>
              ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMode}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {authed ? (
            <>
              {!onCustomer && (
                <Link
                  to="/customer/$name"
                  params={{ name: slug }}
                  className="hidden rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 md:block"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/customer/$name/profile/settings"
                params={{ name: slug }}
                aria-label="Account settings"
                className="rounded-full ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Avatar size="sm">
                  {userData?.avatarUrl && (
                    <AvatarImage src={userData.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>
                    {initials(userData?.name ?? null, userData?.githubLogin ?? null)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/sign-in"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
              >
                Sign in
              </Link>
              <Link
                to="/auth/sign-up"
                className="hidden items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 md:flex"
              >
                <FaGithub className="h-4 w-4" />
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="mt-3 flex flex-col gap-1">
            {onCustomer
              ? CUSTOMER_NAV.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    params={{ name: slug }}
                    onClick={() => setOpen(false)}
                    className={linkBase(customerActive(l.to, l.exact))}
                  >
                    {l.label}
                  </Link>
                ))
              : MARKETING_NAV.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={linkBase(marketingActive(l.to))}
                  >
                    {l.label}
                  </Link>
                ))}

            {authed ? (
              <>
                {!onCustomer && (
                  <Link
                    to="/customer/$name"
                    params={{ name: slug }}
                    onClick={() => setOpen(false)}
                    className="mt-2 flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/customer/$name/profile/settings"
                  params={{ name: slug }}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/sign-in"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md px-3 py-2.5 text-center text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/sign-up"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <FaGithub className="h-4 w-4" />
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
