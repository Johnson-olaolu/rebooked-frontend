import { Outlet, useSearchParams } from "react-router";
import { useBaseStore } from "~/hooks/store";
import { useRedirectOnce } from "~/hooks/useRedirectOnce";
import { getPostAuthPath } from "~/utils/auth";
import AuthSplitLayout from "./AuthSplitLayout";

const AuthEntryLayout = () => {
    const accessToken = useBaseStore((state) => state.accessToken);
    const user = useBaseStore((state) => state.user);
    const [searchParams] = useSearchParams();
    const loggedIn = !!accessToken && !!user;

    // Already logged in (or just logged in): skip login/register. Uses the same
    // target as the login page so the two never disagree.
    useRedirectOnce(loggedIn, user ? getPostAuthPath(user, searchParams.get("redirect")) : "/", {
        state: { email: user?.email },
    });

    if (loggedIn) return null;

    return (
        <AuthSplitLayout
            variant="ink"
            quote="Shelf space is temporary. Good books aren't."
            bullets={[
                "Free to list, always",
                "You keep 100% — no payment processing",
                "Verified emails on both sides",
            ]}
        >
            <Outlet />
        </AuthSplitLayout>
    );
};

export default AuthEntryLayout;
