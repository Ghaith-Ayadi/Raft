import { useState } from "react";
import { LogOut01, RefreshCw01, User01 } from "@untitledui/icons";
import { Sheet } from "@/components/app/sheet";
import { Button } from "@/components/base/buttons/button";
import { useSync } from "@/hooks/use-sync";
import { useAuth } from "@/providers/auth-provider";
import { cx } from "@/utils/cx";

/** Header button: sync state at a glance, sign-in and sign-out behind it. */
export function AccountButton() {
    const { user, isLoading, signInWithGoogle, signOut } = useAuth();
    const { lastSyncedAt } = useSync();
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Must run straight from the click: browsers block the OAuth popup otherwise.
    const handleSignIn = async () => {
        setIsSigningIn(true);
        setError(null);
        const { error } = await signInWithGoogle();
        setIsSigningIn(false);
        if (error) setError(error.message);
        else setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                aria-label="Account"
                onClick={() => setIsOpen(true)}
                className="relative cursor-pointer rounded-full p-2 text-fg-quaternary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
            >
                {user?.avatar ? <img src={user.avatar} alt="" className="size-6 rounded-full" /> : <User01 className="size-6" />}
                {!isLoading && (
                    <span className={cx("absolute right-1.5 bottom-1.5 size-2.5 rounded-full ring-2 ring-bg-primary", user ? "bg-success-solid" : "bg-warning-solid")} />
                )}
            </button>

            <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={user ? "Account" : "Sync across devices"}>
                {user ? (
                    <div className="flex flex-col gap-4">
                        <div>
                            <div className="truncate text-sm font-medium text-primary">{user.email}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-tertiary">
                                <RefreshCw01 className="size-3" />
                                {lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : "Syncing…"}
                            </div>
                        </div>
                        <Button
                            color="secondary"
                            size="lg"
                            iconLeading={LogOut01}
                            onClick={() => {
                                void signOut();
                                setIsOpen(false);
                            }}
                        >
                            Sign out
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-tertiary">Habits live on this device until you sign in. Sign in with Google to keep them everywhere.</p>
                        <Button color="primary" size="lg" isLoading={isSigningIn} onClick={() => void handleSignIn()}>
                            Continue with Google
                        </Button>
                        {error && <p className="text-xs text-error-primary">{error}</p>}
                    </div>
                )}
            </Sheet>
        </>
    );
}
