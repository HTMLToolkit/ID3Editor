import { Plus, Trash2, Clock } from 'lucide-react';

interface SyncedLyricsSectionProps {
  syltFrame: SYLTFrame;
  onTextChange: (text: [string, number][]) => void;
  onMetadataChange: (field: 'language' | 'description', value: string) => void;
}

export function SyncedLyricsSection({
  syltFrame,
  onTextChange,
  onMetadataChange,
}: SyncedLyricsSectionProps) {
  const handleAddEntry = () => {
    onTextChange([...syltFrame.text, ['', 0]]);
  };

  const handleUpdateEntry = (index: number, text: string, timestamp: number) => {
    const updated = syltFrame.text.map((item, i) =>
      i === index ? [text, timestamp] : item
    );
    onTextChange(updated);
  };

  const handleDeleteEntry = (index: number) => {
    onTextChange(syltFrame.text.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Synchronized Lyrics (SYLT)</h2>
      <div className="space-y-4">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <input
              value={syltFrame.language}
              onChange={(e) => onMetadataChange('language', e.target.value)}
              placeholder="eng"
              maxLength={3}
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input
              value={syltFrame.description}
              onChange={(e) => onMetadataChange('description', e.target.value)}
              placeholder="Synced Lyrics"
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Lyrics Entries ({syltFrame.text.length})
            </label>
            <button
              onClick={handleAddEntry}
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1 text-sm flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {syltFrame.text.map((entry, index) => (
              <LyricEntry
                key={index}
                index={index}
                text={entry[0]}
                timestamp={entry[1]}
                onUpdate={handleUpdateEntry}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LyricEntryProps {
  index: number;
  text: string;
  timestamp: number;
  onUpdate: (index: number, text: string, timestamp: number) => void;
  onDelete: (index: number) => void;
}

function LyricEntry({ index, text, timestamp, onUpdate, onDelete }: LyricEntryProps) {
  return (
    <div className="flex items-center space-x-2 p-2 border rounded">
      <input
        value={text}
        onChange={(e) => onUpdate(index, e.target.value, timestamp)}
        placeholder="Lyrics text"
        className="flex-1 border border-input rounded px-2 py-1 text-sm"
      />
      <div className="flex items-center space-x-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <input
          type="number"
          value={timestamp}
          onChange={(e) => onUpdate(index, text, parseInt(e.target.value) || 0)}
          placeholder="ms"
          className="w-20 border border-input rounded px-2 py-1 text-sm"
        />
      </div>
      <button
        onClick={() => onDelete(index)}
        className="bg-destructive text-destructive-foreground rounded px-2 py-1 text-sm hover:bg-destructive/90"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}