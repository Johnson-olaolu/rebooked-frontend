import { Outlet } from "react-router";
import AuthSplitLayout from "./AuthSplitLayout";

const AuthEntryLayout = () => {
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