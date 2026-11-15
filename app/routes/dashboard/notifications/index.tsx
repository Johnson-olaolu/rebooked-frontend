import EmptyState from "../components/EmptyState";

const NotificationsPage = () => (
    <>
        <h1 className="mb-6 font-serif text-3xl md:text-4xl">Notifications</h1>
        <EmptyState
            title="No notifications yet"
            description="We'll let you know here when someone messages you, saves one of your books, or a listing needs attention."
        />
    </>
);

export default NotificationsPage;
