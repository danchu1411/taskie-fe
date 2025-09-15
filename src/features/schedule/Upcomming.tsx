import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function Upcomming() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['schedule', 'upcoming'],
        queryFn: async () => {
            const res = await api.get('/schedules/upcoming');
            return res.data;
        }
    });

    if(isLoading) return <div>Loading...</div>;
    if(error) return <div>Error: {(error as any)?.message}</div>;

    return (
        <div>
            {data?.map((item: any) => (
                <div key={item.id || item.schedule_id}>
                    {item.start_at} . {item.planned_minutes} mins .
                </div>
            ))}
        </div>
    );
}