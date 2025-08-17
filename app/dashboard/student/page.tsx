import {SignedIn, SignedOut, RedirectToSignIn} from "@clerk/nextjs";
import StudentDashboardPage from "@/components/dashboard/student"

export default function DashboardPage() {
    return (
        <div>
            <SignedIn>
                <div className="overflow-hidden">
                    <StudentDashboardPage />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn/>
            </SignedOut>
        </div>
    );
}
