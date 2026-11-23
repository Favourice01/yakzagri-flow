import Link from "next/link";

/** Statuses after which a stream can no longer be cancelled. */
export function isStreamFinalized(status: string | undefined | null): boolean {
  return status === "COMPLETED" || status === "CANCELLED" || status === "TERMINATED";
}

export function StreamActions({
  status,
  cancelHref,
}: {
  status: string | undefined | null;
  cancelHref: string;
}) {
  if (isStreamFinalized(status)) {
    return (
      <span className="rounded-full border border-border-default px-2.5 py-1 text-xs text-text-secondary">
        Stream Finalized
      </span>
    );
  }
  return (
    <Link
      href={cancelHref}
      className="rounded-lg border border-status-danger/30 px-3 py-1.5 text-xs font-medium text-status-danger hover:bg-status-danger/10"
    >
      Cancel Stream
    </Link>
  );
}
