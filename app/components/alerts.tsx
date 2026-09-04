export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-semibold">Greška</p>
            <p className="mt-1">{message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-700"
            title="Zatvori"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function InfoAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
      <div className="flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <p>{message}</p>
      </div>
    </div>
  );
}


