import { useRedirectOnce } from "~/hooks/useRedirectOnce";

/** /admin → the author list, the only admin area so far. */
const AdminIndex = () => {
    useRedirectOnce(true, "/admin/authors");
    return null;
};

export default AdminIndex;
