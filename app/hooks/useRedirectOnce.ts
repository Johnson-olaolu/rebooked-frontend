import { useEffect, useRef } from "react";
import { useNavigate, type NavigateOptions } from "react-router";

/**
 * Navigates to `to` once, as soon as `when` is true.
 *
 * Rendering <Navigate> (or calling navigate on every render) can loop in RSC
 * mode: while the target route is still being discovered the current route
 * keeps rendering and re-issues the redirect. Firing once from an effect avoids that.
 */
export const useRedirectOnce = (when: boolean, to: string, options?: NavigateOptions) => {
  const navigate = useNavigate();
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (!when) {
      fired.current = null;
      return;
    }
    if (fired.current === to) return;
    fired.current = to;
    navigate(to, { replace: true, ...options });
    // options is intentionally excluded: callers pass a fresh object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when, to, navigate]);
};
