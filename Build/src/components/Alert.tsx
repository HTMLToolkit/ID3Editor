interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
}

export function AlertMessage({ type, message }: AlertMessageProps) {
  const className = type === 'error'
    ? 'bg-destructive/15 text-destructive border border-destructive/20'
    : 'bg-green-50 text-green-800 border border-green-200';

  return (
    <div className={`${className} rounded-md p-3 mb-4`}>
      {message}
    </div>
  );
}