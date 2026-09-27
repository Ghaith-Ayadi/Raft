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

/** A modal that sits at the bottom on phones and centred on larger screens. */
export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="max-w-md">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-xl sm:pb-5">
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
