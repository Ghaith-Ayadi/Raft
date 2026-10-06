import type { ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

// Sized to the visual viewport (see lib/viewport.ts) so the keyboard never covers it.
const OVERLAY_STYLE = { top: "var(--vv-top, 0px)", bottom: "auto", height: "var(--vv-height, 100dvh)", minHeight: 0 };

/** A modal that sits at the bottom on phones and centred on larger screens, above the keyboard when one is up. */
export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            style={OVERLAY_STYLE}
            className="in-data-[keyboard=open]:pt-2 in-data-[keyboard=open]:pb-2"
        >
            <Modal className="max-w-md">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-xl in-data-[keyboard=open]:pb-5 sm:pb-5">
                        <div className="flex items-center justify-between gap-4">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                {title}
                            </AriaHeading>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={onClose}
                                className="-m-1.5 cursor-pointer rounded-lg p-1.5 text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        {children}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
