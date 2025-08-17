import {SignedIn, SignedOut, RedirectToSignIn} from "@clerk/nextjs";
import CompanyDashboardPagee from "@/components/dashboard/company"

export default function DashboardPage() {
    return (
        <div>
            <SignedIn>
                <div className="overflow-hidden">
                    <CompanyDashboardPagee />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn/>
            </SignedOut>
        </div>
    );
}
