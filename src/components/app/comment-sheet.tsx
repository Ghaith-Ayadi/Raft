import { useEffect, useState } from "react";
import { Sheet } from "@/components/app/sheet";
import { Button } from "@/components/base/buttons/button";
import { TextArea } from "@/components/base/textarea/textarea";
import { setLogComment } from "@/lib/actions";

interface CommentSheetProps {
    /** The log being commented, or null when closed. */
    target: { logId: string; comment: string; title: string } | null;
    onClose: () => void;
}

/** Add or edit the comment on one log. */
export function CommentSheet({ target, onClose }: CommentSheetProps) {
    const [text, setText] = useState("");

    useEffect(() => {
        if (target) setText(target.comment);
    }, [target]);

    const save = async () => {
        if (!target) return;
        await setLogComment(target.logId, text);
        onClose();
    };

    return (
        <Sheet isOpen={target !== null} onClose={onClose} title={target?.title ?? ""}>
            <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                }}
            >
                <TextArea
                    aria-label="Comment"
                    placeholder="Add a comment"
                    value={text}
                    onChange={setText}
                    autoFocus
                    maxLength={2000}
                    rows={3}
                    onKeyDown={(e) => {
                        // Enter validates; Shift+Enter makes a new line.
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void save();
                        }
                    }}
                />
                <Button type="submit" color="primary" size="lg">
                    Save comment
                </Button>
            </form>
        </Sheet>
    );
}
