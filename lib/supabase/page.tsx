import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import PhoneLoginDemo from "../../app/phone-login/PhoneLoginDemo";

export default async function PhoneLoginPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return <PhoneLoginDemo user={user} />;
}
