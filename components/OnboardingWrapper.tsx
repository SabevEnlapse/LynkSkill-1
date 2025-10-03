"use client";

import { usePathname } from "next/navigation";
import RegisterUser from "@/components/RegisterUser";

export default function OnboardingWrapper() {
    const pathname = usePathname();

    if (pathname !== "/onboarding") return null;
    return <RegisterUser />;
}
