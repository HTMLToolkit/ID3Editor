import { Download } from 'lucide-react';

interface ProcessButtonProps {
  disabled: boolean;
  isProcessing: boolean;
  fileName?: string;
  onProcess: () => void;
}

export function ProcessButton({
  disabled,
  isProcessing,
  onProcess,
}: ProcessButtonProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
      <div className="flex justify-center">
        <button
          onClick={onProcess}
          disabled={disabled}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Process & Download
            </>
          )}
        </button>
      </div>
    </div>
  );
}