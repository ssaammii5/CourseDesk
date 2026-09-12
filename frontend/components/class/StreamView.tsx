import { Info, PenLine } from "lucide-react";
import { AnnouncementCard } from "@/components/class/AnnouncementCard";
import type { ClassDetails } from "@/lib/schemas";

interface StreamViewProps {
    title: string;
    details: ClassDetails;
}

export function StreamView({ title, details }: StreamViewProps) {
    const hasDueWork = details.classwork.some((c) => c.status === "Assigned");
    return (
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-8">
            {/* Class banner */}
            <div
                className="relative h-60 overflow-hidden rounded-xl sm:h-64"
                style={{ backgroundColor: details.bannerColor }}
            >
                {/* Decorative emoji */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-8 flex items-center gap-4 opacity-90"
                >
                    <span className="text-6xl -rotate-12">✏️</span>
                    <span className="text-8xl rotate-6">{details.bannerEmoji}</span>
                </div>

                <div className="absolute left-6 right-44 top-7">
                    <h1 className="truncate text-3xl font-medium text-white sm:text-4xl">{title}</h1>
                    {details.session && (
                        <p className="mt-3 truncate text-base text-white/90 sm:text-lg">{details.session}</p>
                    )}
                </div>

                <button
                    type="button"
                    aria-label="Class information"
                    className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                    <Info className="h-6 w-6" />
                </button>
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                {/* Left column */}
                <div className="w-full shrink-0 lg:w-[300px]">
                    {/* Upcoming card */}
                    <section className="rounded-lg border border-gray-200 bg-white p-4">
                        <h3 className="text-base text-gray-800">Upcoming</h3>
                        <p className="mt-3 text-sm text-gray-600">
                            {hasDueWork ? "You have work due soon." : "Woohoo, no work due soon!"}
                        </p>
                        <div className="mt-3 text-right">
                            <a href="#" className="text-sm font-medium text-[#1a73e8] hover:underline">
                                View all
                            </a>
                        </div>
                    </section>
                </div>

                {/* Right column: announcements */}
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        className="flex items-center gap-3 rounded-full bg-[#cfe8fc] px-5 py-2.5 text-sm font-medium text-[#174ea6] hover:bg-[#b9dcf8]"
                    >
                        <PenLine className="h-4 w-4" />
                        New announcement
                    </button>

                    <div className="mt-5 flex flex-col gap-4">
                        {details.announcements.length === 0 && (
                            <p className="py-8 text-center text-sm text-gray-600">No announcements yet.</p>
                        )}
                        {details.announcements.map((a) => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                href={`/class/${details.courseId}/assignments/${a.id}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}