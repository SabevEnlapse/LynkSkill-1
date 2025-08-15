import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UsersPage() {
    const { data, error } = useSWR("/api/users", fetcher);

    if (error) return <div>Error loading users</div>;
    if (!data) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">All Users</h1>
            <ul className="space-y-2">
                {data.map((user: any) => (
                    <li key={user.id} className="border p-2 rounded">
                        <strong>{user.profile?.name || "No Name"}</strong> - {user.role} - {user.clerkId}
                    </li>
                ))}
            </ul>
        </div>
    );
}
