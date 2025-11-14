import { FileText } from 'lucide-react';

interface FileUploadSectionProps {
  file: File | null;
  onFileUpload: (file: File | null) => void;
}

export function FileUploadSection({ file, onFileUpload }: FileUploadSectionProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileUpload(event.target.files?.[0] || null);
  };

  return (
    <div className="space-y-2 mb-4">
      <label className="text-sm font-medium">Upload MP3 File</label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept="audio/mpeg"
          onChange={handleChange}
          className="flex-1 border border-input rounded-md px-3 py-2 text-sm"
        />
        {file && (
          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap">
            <FileText className="h-3 w-3" />
            {file.name}
          </span>
        )}
      </div>
    </div>
  );
}