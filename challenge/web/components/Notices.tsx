type Props = {
  confirmation: string | null;
  onDismissConfirmation: () => void;
};

export function Notices({ confirmation, onDismissConfirmation }: Props) {
  return (
    <div className="notices" role="status">
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
