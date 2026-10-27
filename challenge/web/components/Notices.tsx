type Props = {
  confirmation: string | null;
  stale: boolean;
  onDismissConfirmation: () => void;
};

export function Notices({ confirmation, stale, onDismissConfirmation }: Props) {
  return (
    <div className="notices" role="status">
      {stale && (
        <p className="notice notice-warning">
          <span>May be out of date: the calendar could not be updated. Retrying automatically.</span>
        </p>
      )}
      {confirmation && (
        <p className="notice">
          <span>{confirmation}</span>
          <button type="button" onClick={onDismissConfirmation} aria-label="Dismiss confirmation">
            ×
          </button>
        </p>
      )}
    </div>
  );
}
