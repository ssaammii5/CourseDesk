"use client";

import React, { useMemo } from "react";
import { ExternalLink } from "lucide-react";

export interface RichTextContentProps {
    text?: string | null;
    fallback?: string;
    className?: string;
}

const ALLOWED_TAGS = new Set([
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "strong", "b", "em", "i", "u", "s", "del", "strike",
    "mark", "blockquote", "pre", "code",
    "ul", "ol", "li", "hr", "a", "span", "div", "br",
]);

function isSafeUrl(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:")
    );
}

function domNodeToReact(node: Node, key: string | number): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    const childNodes = Array.from(element.childNodes);
    const children = childNodes.map((child, idx) => domNodeToReact(child, `${key}-${idx}`));

    if (!ALLOWED_TAGS.has(tagName)) {
        return <span key={key}>{children}</span>;
    }

    switch (tagName) {
        case "h1":
            return (
                <h2 key={key} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-3.5 mb-2 tracking-tight">
                    {children}
                </h2>
            );
        case "h2":
            return (
                <h3 key={key} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3 mb-1.5 tracking-tight">
                    {children}
                </h3>
            );
        case "h3":
        case "h4":
        case "h5":
        case "h6":
            return (
                <h4 key={key} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2.5 mb-1 tracking-tight">
                    {children}
                </h4>
            );
        case "p":
            return (
                <p key={key} className="my-1.5 leading-relaxed text-slate-800 dark:text-slate-200">
                    {children}
                </p>
            );
        case "strong":
        case "b":
            return (
                <strong key={key} className="font-semibold text-slate-900 dark:text-white">
                    {children}
                </strong>
            );
        case "em":
        case "i":
            return (
                <em key={key} className="italic text-slate-800 dark:text-slate-200">
                    {children}
                </em>
            );
        case "u":
            return (
                <span key={key} className="underline underline-offset-2">
                    {children}
                </span>
            );
        case "s":
        case "del":
        case "strike":
            return (
                <s key={key} className="line-through text-slate-400 dark:text-slate-500">
                    {children}
                </s>
            );
        case "mark":
            return (
                <mark key={key} className="rounded bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 text-amber-900 dark:text-amber-200">
                    {children}
                </mark>
            );
        case "blockquote":
            return (
                <blockquote
                    key={key}
                    className="my-2 rounded-r-lg border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 py-1.5 pl-4 italic text-slate-700 dark:text-slate-300"
                >
                    {children}
                </blockquote>
            );
        case "pre":
            return (
                <pre
                    key={key}
                    className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3.5 font-mono text-xs text-slate-100"
                >
                    {children}
                </pre>
            );
        case "code":
            return (
                <code
                    key={key}
                    className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-600 dark:text-indigo-400"
                >
                    {children}
                </code>
            );
        case "ul":
            return (
                <ul key={key} className="my-2 list-disc space-y-1 pl-6 text-slate-800 dark:text-slate-200">
                    {children}
                </ul>
            );
        case "ol":
            return (
                <ol key={key} className="my-2 list-decimal space-y-1 pl-6 text-slate-800 dark:text-slate-200">
                    {children}
                </ol>
            );
        case "li":
            return (
                <li key={key} className="leading-relaxed">
                    {children}
                </li>
            );
        case "hr":
            return <hr key={key} className="my-3 border-slate-200 dark:border-slate-800" />;
        case "br":
            return <br key={key} />;
        case "a": {
            const rawHref = element.getAttribute("href") || "";
            const safeHref = isSafeUrl(rawHref) ? rawHref : "#";
            return (
                <a
                    key={key}
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500 transition-colors"
                >
                    <span>{children}</span>
                    <ExternalLink className="inline-block h-3 w-3 shrink-0" />
                </a>
            );
        }
        case "div":
        case "span":
        default:
            return <span key={key}>{children}</span>;
    }
}

/**
 * Parses basic markdown syntax if plain text is provided instead of HTML
 */
function renderMarkdownOrPlainText(content: string): React.ReactNode {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    const elements: React.ReactNode[] = [];

    const formatInline = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let pKey = 0;

        while (remaining) {
            // Bold
            const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
            // Italic
            const italicMatch = remaining.match(/\*(.*?)\*/);
            // Inline code
            const codeMatch = remaining.match(/`(.*?)`/);
            // Links
            const linkMatch = remaining.match(/\[(.*?)\]\((https?:\/\/.*?)\)/);

            const matches = [
                boldMatch ? { type: "bold", index: boldMatch.index!, length: boldMatch[0].length, content: boldMatch[1] } : null,
                italicMatch ? { type: "italic", index: italicMatch.index!, length: italicMatch[0].length, content: italicMatch[1] } : null,
                codeMatch ? { type: "code", index: codeMatch.index!, length: codeMatch[0].length, content: codeMatch[1] } : null,
                linkMatch ? { type: "link", index: linkMatch.index!, length: linkMatch[0].length, text: linkMatch[1], url: linkMatch[2] } : null,
            ].filter((m): m is NonNullable<typeof m> => m !== null)
             .sort((a, b) => a.index - b.index);

            if (matches.length === 0) {
                parts.push(remaining);
                break;
            }

            const first = matches[0];
            if (first.index > 0) {
                parts.push(remaining.slice(0, first.index));
            }

            if (first.type === "bold") {
                parts.push(<strong key={`b-${pKey++}`} className="font-semibold text-slate-900 dark:text-white">{first.content}</strong>);
            } else if (first.type === "italic") {
                parts.push(<em key={`i-${pKey++}`} className="italic">{first.content}</em>);
            } else if (first.type === "code") {
                parts.push(
                    <code key={`c-${pKey++}`} className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                        {first.content}
                    </code>
                );
            } else if (first.type === "link" && "url" in first && "text" in first) {
                parts.push(
                    <a
                        key={`a-${pKey++}`}
                        href={first.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500"
                    >
                        <span>{first.text}</span>
                        <ExternalLink className="inline-block h-3 w-3" />
                    </a>
                );
            }

            remaining = remaining.slice(first.index + first.length);
        }

        return parts.length === 1 ? parts[0] : <React.Fragment>{parts}</React.Fragment>;
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("```")) {
            if (inCodeBlock) {
                elements.push(
                    <pre key={`code-${idx}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200">
                        <code>{codeBlockLines.join("\n")}</code>
                    </pre>
                );
                codeBlockLines = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeBlockLines.push(line);
            return;
        }

        if (trimmed.startsWith("# ")) {
            elements.push(<h2 key={`h1-${idx}`} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-3 mb-1.5">{trimmed.slice(2)}</h2>);
        } else if (trimmed.startsWith("## ")) {
            elements.push(<h3 key={`h2-${idx}`} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-2.5 mb-1">{trimmed.slice(3)}</h3>);
        } else if (trimmed.startsWith("### ")) {
            elements.push(<h4 key={`h3-${idx}`} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2 mb-1">{trimmed.slice(4)}</h4>);
        } else if (trimmed.startsWith("> ")) {
            elements.push(
                <blockquote key={`bq-${idx}`} className="my-1.5 rounded-r-md border-l-4 border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 py-1.5 pl-3 italic text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    {formatInline(trimmed.slice(2))}
                </blockquote>
            );
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            elements.push(
                <ul key={`ul-${idx}`} className="my-1 list-disc pl-6 text-slate-800 dark:text-slate-200">
                    <li className="leading-relaxed">{formatInline(trimmed.slice(2))}</li>
                </ul>
            );
        } else if (!trimmed) {
            elements.push(<div key={`empty-${idx}`} className="h-2" />);
        } else {
            elements.push(
                <p key={`p-${idx}`} className="my-1.5 leading-relaxed text-slate-800 dark:text-slate-200">
                    {formatInline(line)}
                </p>
            );
        }
    });

    if (inCodeBlock && codeBlockLines.length > 0) {
        elements.push(
            <pre key="code-end" className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200">
                <code>{codeBlockLines.join("\n")}</code>
            </pre>
        );
    }

    return elements;
}

export function RichTextContent({
    text,
    fallback = "No instructions provided.",
    className = "",
}: RichTextContentProps) {
    const content = useMemo(() => {
        if (!text || !text.trim()) {
            return (
                <p className="italic text-slate-400 dark:text-slate-500">
                    {fallback}
                </p>
            );
        }

        const isHtml = /<[a-z][\s\S]*>/i.test(text);

        // When running in the browser (client-side), parse HTML immediately on the first render
        // without waiting for an async useEffect, preventing any flash of raw HTML markup.
        if (typeof window !== "undefined" && isHtml) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");
                const bodyChildren = Array.from(doc.body.childNodes);
                if (bodyChildren.length > 0) {
                    return (
                        <div className="space-y-1">
                            {bodyChildren.map((node, idx) => domNodeToReact(node, `html-${idx}`))}
                        </div>
                    );
                }
            } catch {
                // Fall back to markdown/plain text renderer
            }
        }

        // On the server during SSR (if text is HTML), strip the HTML tags
        // so raw markup like <p> or <div> never flashes or shows on screen as plaintext.
        if (typeof window === "undefined" && isHtml) {
            const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            return (
                <div className="space-y-1">
                    <p className="my-1.5 leading-relaxed text-slate-800 dark:text-slate-200">
                        {stripped}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-1">
                {renderMarkdownOrPlainText(text)}
            </div>
        );
    }, [text, fallback]);

    return (
        <div suppressHydrationWarning className={`text-sm text-slate-800 dark:text-slate-200 ${className}`}>
            {content}
        </div>
    );
}
