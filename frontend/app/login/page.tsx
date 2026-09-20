import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign in - CourseDesk",
};

export default function LoginPage() {
    redirect("/");
}