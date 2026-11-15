import { Navigate } from "react-router";

/** Old /dashboard/listings links → the shelf (see docs/TERMINOLOGY.md). */
const ListingsRedirect = () => <Navigate to="/dashboard/shelf" replace />;

export default ListingsRedirect;
