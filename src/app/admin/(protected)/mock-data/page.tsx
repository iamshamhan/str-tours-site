import { requireAdmin } from "@/lib/admin/auth";
import { CleanupForm } from "./cleanup-form";
export default async function MockDataPage(){
 const {supabase}=await requireAdmin(),{data,error}=await supabase.rpc("mock_data_status");
 return <><h1>Mock content</h1><section className="admin-form-card"><h2>A preview you can clear</h2><p>Sample content remains marked as mock even after editing. Create fresh records for verified business content. Cleanup preserves real records and blocks removal if they still reference samples.</p>{error?<p role="alert">Unable to load mock status. Refresh before removing anything.</p>:<><dl className="dashboard-stats">{Object.entries(data.counts as Record<string,number>).map(([name,count])=><div key={name}><dt>{name.replaceAll("_"," ")}</dt><dd>{count}</dd></div>)}</dl><p>Media files awaiting cleanup: {data.pending}</p><CleanupForm/></>}</section></>;
}
