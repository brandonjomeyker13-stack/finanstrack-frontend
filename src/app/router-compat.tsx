import { Children, isValidElement, useEffect, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

export function useLocation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return { pathname };
}

export function useNavigate() {
  const router = useRouter();
  return (to: string, opts?: { replace?: boolean | undefined }) => {
    if (opts?.replace) router.history.replace(to);
    else router.history.push(to);
  };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navegar = useNavigate();
  useEffect(() => navegar(to, { replace }), [to]);
  return null;
}

type LinkProps = {
  to: string;
  children: ReactNode;
  className?: string | ((s: { isActive: boolean }) => string);
  end?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

function useLinkProps({ to, className, end, onClick }: LinkProps) {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const isActive = end || to === "/" ? pathname === to : pathname.startsWith(to);
  return {
    href: to,
    "aria-current": isActive ? ("page" as const) : undefined,
    className: typeof className === "function" ? className({ isActive }) : className,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navegar(to);
    },
  };
}

export function Link(props: LinkProps) {
  return <a {...useLinkProps(props)}>{props.children}</a>;
}
export const NavLink = Link;

export function Route(_: { path: string; element: ReactNode }) {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const rutas = Children.toArray(children).filter(isValidElement) as ReactElement<{ path: string; element: ReactNode }>[];
  const hit = rutas.find((r) => r.props.path === pathname) ?? rutas.find((r) => r.props.path === "*");
  return <>{hit?.props.element ?? null}</>;
}
