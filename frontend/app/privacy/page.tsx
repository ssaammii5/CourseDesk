import type { Metadata } from "next";
import { PrivacyPolicyView } from "@/features/auth";

export const metadata: Metadata = {
    title: "Privacy Policy - CourseDesk",
    description: "Learn how CourseDesk protects your academic privacy, student coursework, and educational records.",
};

export default function PrivacyPolicyPage() {
    return <PrivacyPolicyView />;
}
