import { Upload } from 'lucide-react';

interface LrcImportSectionProps {
  lrcText: string;
  onLrcTextChange: (text: string) => void;
  onImport: () => void;
}

export function LrcImportSection({
  lrcText,
  onLrcTextChange,
  onImport,
}: LrcImportSectionProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">LRC Format Lyrics</label>
        <textarea
          placeholder="[00:01.40]These are lyrics&#10;[00:02.75]Still lyrics&#10;[00:04.10]Are you bored yet?&#10;[00:05.91]The End"
          value={lrcText}
          onChange={(e) => onLrcTextChange(e.target.value)}
          rows={8}
          className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono"
        />
        <div className="flex space-x-2">
          <button
            onClick={onImport}
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 text-sm flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import LRC
          </button>
        </div>
      </div>
    </div>
  );
}