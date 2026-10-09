import type { Metadata } from "next";
import { TermsOfServiceView } from "@/features/auth";

export const metadata: Metadata = {
    title: "Terms of Service - CourseDesk",
    description: "Read the CourseDesk terms of service, acceptable academic use, and platform honor code.",
};

export default function TermsOfServicePage() {
    return <TermsOfServiceView />;
}
