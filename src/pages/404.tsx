import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">Page not found</p>
      <Link to="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
