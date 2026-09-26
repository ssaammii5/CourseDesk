"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Bold,
    Check,
    Code,
    Eraser,
    ExternalLink,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo,
    Strikethrough,
    Underline,
    Undo,
    X,
} from "lucide-react";

export interface RichTextEditorProps {
    value?: string;
    onChange?: (html: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    minHeight?: string;
    maxHeight?: string;
    className?: string;
    toolbarClassName?: string;
    contentClassName?: string;
    readOnly?: boolean;
    autoFocus?: boolean;
    showWordCount?: boolean;
    id?: string;
}

export interface ActiveFormats {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    unorderedList: boolean;
    orderedList: boolean;
    h1: boolean;
    h2: boolean;
    h3: boolean;
    blockquote: boolean;
    code: boolean;
}

function getContainingBlock(
    node: Node | null,
    root: HTMLElement | null,
    tagNames: string[],
): HTMLElement | null {
    let curr: Node | null = node;
    const targets = tagNames.map((t) => t.toUpperCase());
    while (curr && curr !== root) {
        if (curr.nodeType === Node.ELEMENT_NODE && targets.includes((curr as HTMLElement).tagName)) {
            return curr as HTMLElement;
        }
        curr = curr.parentNode;
    }
    return null;
}

function setCaretToElement(el: HTMLElement) {
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

/**
 * Converts initial plain text or markdown to simple HTML for the contentEditable area if needed
 */
export function normalizeContentToHtml(content: string): string {
    if (!content) return "";
    // If it already contains HTML tags, return as-is
    if (/<[a-z][\s\S]*>/i.test(content)) {
        return content;
    }
    // Otherwise convert basic markdown or line breaks to HTML
    const lines = content.split("\n");
    return lines
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "<p><br></p>";
            if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
            if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
            if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
            if (trimmed.startsWith("> ")) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return `<ul><li>${trimmed.slice(2)}</li></ul>`;

            let formatted = line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/`(.*?)`/g, "<code>$1</code>")
                .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2">$1</a>');
            return `<p>${formatted}</p>`;
        })
        .join("");
}

export function RichTextEditor({
    value = "",
    onChange,
    onBlur,
    placeholder = "Write down your content here...",
    minHeight = "220px",
    maxHeight = "460px",
    className = "",
    toolbarClassName = "",
    contentClassName = "",
    readOnly = false,
    autoFocus = false,
    showWordCount = true,
    id,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Live word and char counts
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    // Active formatting states for toolbar highlighting
    const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        unorderedList: false,
        orderedList: false,
        h1: false,
        h2: false,
        h3: false,
        blockquote: false,
        code: false,
    });

    // Link insertion popover state
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");

    // Update active toolbar format indicators
    const checkActiveFormats = useCallback(() => {
        if (typeof document === "undefined") return;
        try {
            const formatBlockValue = (document.queryCommandValue("formatBlock") || "").toLowerCase();
            const selection = window.getSelection();
            const anchor = selection?.anchorNode ?? null;
            const insidePre = Boolean(getContainingBlock(anchor, editorRef.current, ["pre"]));
            const insideBlockquote =
                formatBlockValue === "blockquote" ||
                Boolean(getContainingBlock(anchor, editorRef.current, ["blockquote"]));

            setActiveFormats({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                strike: document.queryCommandState("strikeThrough"),
                unorderedList: document.queryCommandState("insertUnorderedList"),
                orderedList: document.queryCommandState("insertOrderedList"),
                h1: formatBlockValue === "h1",
                h2: formatBlockValue === "h2",
                h3: formatBlockValue === "h3",
                blockquote: insideBlockquote,
                code: insidePre || formatBlockValue === "pre",
            });
        } catch {
            // Ignore
        }
    }, []);

    // Calculate word & character counts from editor and emit onChange
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || "";
        const clean = text.trim();
        setWordCount(clean ? clean.split(/\s+/).length : 0);
        setCharCount(text.length);
        checkActiveFormats();

        if (onChange) {
            const currentHtml = editorRef.current.innerHTML;
            // Treat empty paragraph or whitespace as empty
            if (currentHtml === "<p><br></p>" || currentHtml === "<br>" || !clean) {
                onChange("");
            } else {
                onChange(currentHtml);
            }
        }
    }, [checkActiveFormats, onChange]);

    // Synchronize initial or external value changes safely
    useEffect(() => {
        if (!editorRef.current) return;
        const normalized = normalizeContentToHtml(value);
        if (editorRef.current.innerHTML !== normalized) {
            // Only update DOM if content actually differs to preserve caret during local typing
            const currentContent = editorRef.current.innerHTML;
            if (currentContent !== normalized && (normalized || currentContent !== "<p><br></p>")) {
                editorRef.current.innerHTML = normalized;
                const text = editorRef.current.innerText || "";
                const clean = text.trim();
                setWordCount(clean ? clean.split(/\s+/).length : 0);
                setCharCount(text.length);
            }
        }
    }, [value]);

    useEffect(() => {
        if (autoFocus && editorRef.current) {
            editorRef.current.focus();
        }
    }, [autoFocus]);

    /* ---------- Document Commands ---------- */

    const executeFormat = (command: string, formatValue: string | undefined = undefined) => {
        if (readOnly || !editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, formatValue);
        handleInput();
    };

    const toggleCodeBlock = () => {
        if (readOnly || !editorRef.current) return;
        editorRef.current.focus();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const preEl = getContainingBlock(range.startContainer, editorRef.current, ["pre"]);
            if (preEl) {
                if (!range.collapsed) {
                    document.execCommand("formatBlock", false, "<p>");
                } else {
                    const p = document.createElement("p");
                    p.innerHTML = "<br>";
                    if (preEl.nextSibling) {
                        preEl.parentNode?.insertBefore(p, preEl.nextSibling);
                    } else {
                        preEl.parentNode?.appendChild(p);
                    }
                    setCaretToElement(p);
                }
                handleInput();
                return;
            }
        }

        executeFormat("formatBlock", "<pre>");
    };

    const handleOpenLinkDialog = () => {
        if (readOnly) return;
        const selection = window.getSelection();
        const selectedStr = selection ? selection.toString() : "";
        setLinkText(selectedStr);
        setLinkUrl("");
        setLinkDialogOpen(true);
    };

    const confirmInsertLink = () => {
        if (!linkUrl.trim() || !editorRef.current) return;
        editorRef.current.focus();
        const urlToUse = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;

        if (linkText.trim()) {
            document.execCommand(
                "insertHTML",
                false,
                `<a href="${urlToUse}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`,
            );
        } else {
            document.execCommand("createLink", false, urlToUse);
        }

        setLinkDialogOpen(false);
        setLinkUrl("");
        setLinkText("");
        handleInput();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (readOnly) return;
        const sel = window.getSelection();
        const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

        // Check if inside pre or blockquote
        const preEl = range && editorRef.current ? getContainingBlock(range.startContainer, editorRef.current, ["pre"]) : null;
        const bqEl = range && editorRef.current ? getContainingBlock(range.startContainer, editorRef.current, ["blockquote"]) : null;

        // Escape: step out of code block or blockquote immediately
        if (e.key === "Escape" && (preEl || bqEl)) {
            e.preventDefault();
            const targetEl = preEl || bqEl;
            if (targetEl) {
                const p = document.createElement("p");
                p.innerHTML = "<br>";
                if (targetEl.nextSibling) {
                    targetEl.parentNode?.insertBefore(p, targetEl.nextSibling);
                } else {
                    targetEl.parentNode?.appendChild(p);
                }
                setCaretToElement(p);
                handleInput();
            }
            return;
        }

        // Ctrl+Enter or Cmd+Enter: step out of code block or blockquote into a new paragraph
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            if (preEl || bqEl) {
                e.preventDefault();
                const targetEl = preEl || bqEl;
                if (targetEl) {
                    const p = document.createElement("p");
                    p.innerHTML = "<br>";
                    if (targetEl.nextSibling) {
                        targetEl.parentNode?.insertBefore(p, targetEl.nextSibling);
                    } else {
                        targetEl.parentNode?.appendChild(p);
                    }
                    setCaretToElement(p);
                    handleInput();
                }
                return;
            }
        }

        // Tab inside code block: indent 2 spaces instead of losing focus
        if (e.key === "Tab" && preEl) {
            e.preventDefault();
            document.execCommand("insertText", false, "  ");
            handleInput();
            return;
        }

        // ArrowDown at the end of pre: step into paragraph below
        if (e.key === "ArrowDown" && preEl && range) {
            const isAtEnd =
                (range.startContainer === preEl && range.startOffset === preEl.childNodes.length) ||
                (range.startContainer.nodeType === Node.TEXT_NODE &&
                    range.startOffset === (range.startContainer.textContent?.length ?? 0) &&
                    !range.startContainer.nextSibling);

            if (isAtEnd && !preEl.nextSibling) {
                e.preventDefault();
                const p = document.createElement("p");
                p.innerHTML = "<br>";
                preEl.parentNode?.appendChild(p);
                setCaretToElement(p);
                handleInput();
                return;
            }
        }

        // Regular Enter inside pre or blockquote: detect double Enter or empty block to break out
        if (e.key === "Enter" && !e.shiftKey) {
            if (preEl && range) {
                const fullText = preEl.innerText || "";
                if (!fullText.trim()) {
                    e.preventDefault();
                    const p = document.createElement("p");
                    p.innerHTML = "<br>";
                    preEl.parentNode?.replaceChild(p, preEl);
                    setCaretToElement(p);
                    handleInput();
                    return;
                }

                const preRange = range.cloneRange();
                preRange.selectNodeContents(preEl);
                preRange.setEnd(range.startContainer, range.startOffset);
                const textBefore = preRange.toString();

                if (textBefore.endsWith("\n") || textBefore.endsWith("\r\n")) {
                    e.preventDefault();
                    if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.textContent) {
                        range.startContainer.textContent = range.startContainer.textContent.replace(/\n$/, "");
                    }
                    const p = document.createElement("p");
                    p.innerHTML = "<br>";
                    if (preEl.nextSibling) {
                        preEl.parentNode?.insertBefore(p, preEl.nextSibling);
                    } else {
                        preEl.parentNode?.appendChild(p);
                    }
                    setCaretToElement(p);
                    handleInput();
                    return;
                }
            }

            if (bqEl && range) {
                const bqText = bqEl.innerText || "";
                if (!bqText.trim()) {
                    e.preventDefault();
                    const p = document.createElement("p");
                    p.innerHTML = "<br>";
                    bqEl.parentNode?.replaceChild(p, bqEl);
                    setCaretToElement(p);
                    handleInput();
                    return;
                }

                const bqRange = range.cloneRange();
                bqRange.selectNodeContents(bqEl);
                bqRange.setEnd(range.startContainer, range.startOffset);
                const textBefore = bqRange.toString();

                if (textBefore.endsWith("\n") || textBefore.endsWith("\r\n")) {
                    e.preventDefault();
                    const p = document.createElement("p");
                    p.innerHTML = "<br>";
                    if (bqEl.nextSibling) {
                        bqEl.parentNode?.insertBefore(p, bqEl.nextSibling);
                    } else {
                        bqEl.parentNode?.appendChild(p);
                    }
                    setCaretToElement(p);
                    handleInput();
                    return;
                }
            }
        }

        // Standard formatting shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === "b") {
                e.preventDefault();
                executeFormat("bold");
            } else if (e.key.toLowerCase() === "i") {
                e.preventDefault();
                executeFormat("italic");
            } else if (e.key.toLowerCase() === "u") {
                e.preventDefault();
                executeFormat("underline");
            } else if (e.key.toLowerCase() === "k") {
                e.preventDefault();
                handleOpenLinkDialog();
            }
        }
    };

    return (
        <div
            className={`relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs focus-within:border-indigo-500/80 dark:focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all overflow-hidden ${className}`}
        >
            {/* Formatting Toolbar */}
            {!readOnly && (
                <div
                    className={`flex flex-wrap items-center gap-1 p-2 bg-slate-50/90 dark:bg-slate-850/90 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${toolbarClassName}`}
                >
                    {/* Headings (H1, H2, H3) */}
                    <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("formatBlock", activeFormats.h1 ? "<p>" : "<h1>");
                            }}
                            title="Heading 1"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.h1
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Heading1 className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("formatBlock", activeFormats.h2 ? "<p>" : "<h2>");
                            }}
                            title="Heading 2"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.h2
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Heading2 className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("formatBlock", activeFormats.h3 ? "<p>" : "<h3>");
                            }}
                            title="Heading 3"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.h3
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Heading3 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                    {/* Text Styles (B, I, U, S, Highlight) */}
                    <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("bold");
                            }}
                            title="Bold (Ctrl+B)"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.bold
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Bold className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("italic");
                            }}
                            title="Italic (Ctrl+I)"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.italic
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Italic className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("underline");
                            }}
                            title="Underline (Ctrl+U)"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.underline
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Underline className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("strikeThrough");
                            }}
                            title="Strikethrough"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.strike
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Strikethrough className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("hiliteColor", "#fef08a");
                            }}
                            title="Highlight text"
                            className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            <Highlighter className="h-4 w-4 text-amber-500" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                    {/* Lists, Quote, Code */}
                    <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("insertUnorderedList");
                            }}
                            title="Bulleted List"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.unorderedList
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("insertOrderedList");
                            }}
                            title="Numbered List"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.orderedList
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("formatBlock", activeFormats.blockquote ? "<p>" : "<blockquote>");
                            }}
                            title="Quote Block"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.blockquote
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Quote className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleCodeBlock();
                            }}
                            title="Code Block (Press Enter twice, Ctrl+Enter, or Esc to exit)"
                            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                activeFormats.code
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                            }`}
                        >
                            <Code className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                    {/* Link, Rule, Clear Format, Undo, Redo */}
                    <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleOpenLinkDialog();
                            }}
                            title="Insert Link (Ctrl+K)"
                            className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            <LinkIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("insertHorizontalRule");
                            }}
                            title="Horizontal Divider Line"
                            className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("removeFormat");
                            }}
                            title="Clear Formatting"
                            className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            <Eraser className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("undo");
                            }}
                            title="Undo (Ctrl+Z)"
                            className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            <Undo className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                executeFormat("redo");
                            }}
                            title="Redo (Ctrl+Y)"
                            className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            <Redo className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Direct WYSIWYG Document Canvas */}
            <div
                id={id}
                ref={editorRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={handleInput}
                onMouseUp={checkActiveFormats}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                data-placeholder={placeholder}
                style={{ minHeight, maxHeight }}
                className={`w-full overflow-y-auto p-5 text-sm text-slate-900 dark:text-slate-100 outline-none leading-relaxed font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500 empty:before:pointer-events-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mb-2.5 [&_h1]:mt-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mb-2 [&_h2]:mt-1 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mb-1.5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:bg-indigo-50/50 [&_blockquote]:dark:bg-indigo-950/30 [&_blockquote]:pl-4 [&_blockquote]:py-1.5 [&_blockquote]:italic [&_blockquote]:rounded-r-lg [&_blockquote]:my-2 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2.5 [&_pre]:overflow-x-auto [&_a]:text-indigo-600 [&_a]:dark:text-indigo-400 [&_a]:underline [&_a]:font-medium [&_mark]:bg-amber-100 [&_mark]:dark:bg-amber-900/40 [&_mark]:px-1 [&_mark]:rounded ${contentClassName}`}
            />

            {/* Document Footer Bar */}
            {showWordCount && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-850">
                    {activeFormats.code ? (
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold animate-in fade-in duration-150">
                            <Code className="h-3.5 w-3.5" />
                            <span>Inside Code Block — press Enter twice, Ctrl+Enter, or Esc to exit</span>
                        </span>
                    ) : (
                        <span className="text-slate-400">
                            Markdown shortcuts supported
                        </span>
                    )}
                    <div className="flex items-center gap-3 font-medium">
                        <span>{wordCount} words</span>
                        <span>{charCount} characters</span>
                    </div>
                </div>
            )}

            {/* Insert Link Dialog Modal */}
            {linkDialogOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Insert Hyperlink</span>
                            </h4>
                            <button
                                type="button"
                                onClick={() => setLinkDialogOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Display Text (optional)
                                </label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    placeholder="Write down link text..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Link URL <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            confirmInsertLink();
                                        }
                                    }}
                                    placeholder="Write down or paste link URL..."
                                    autoFocus
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setLinkDialogOpen(false)}
                                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmInsertLink}
                                disabled={!linkUrl.trim()}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs"
                            >
                                Insert Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
