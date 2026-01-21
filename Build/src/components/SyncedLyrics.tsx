import { useRef, useState } from "react";
import { Plus, Trash2, Clock, Upload, FileText } from "lucide-react";
import { useLRCParser } from "../hooks/useLRCParser";

const DEFAULT_SYLT_FRAME: SYLTFrame = {
  type: 1,
  text: [],
  timestampFormat: 2,
  language: "eng",
  description: "Lyrics",
};

const DEFAULT_USLT_FRAME: USLTFrame = {
  language: "eng",
  description: "",
  lyrics: "",
};

interface SyncedLyricsSectionProps {
  syltFrames: SYLTFrame[];
  usltFrames: USLTFrame[];
  onSyltFramesChange: React.Dispatch<React.SetStateAction<SYLTFrame[]>>;
  onUsltFramesChange: React.Dispatch<React.SetStateAction<USLTFrame[]>>;
}

export function SyncedLyricsSection({
  syltFrames,
  usltFrames,
  onSyltFramesChange,
  onUsltFramesChange,
}: SyncedLyricsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lrcText, setLrcText] = useState("");
  const [showLrcImport, setShowLrcImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { parseLRCFormat, parseLRCFile } = useLRCParser();

  const currentSylt = syltFrames[activeIndex] || { ...DEFAULT_SYLT_FRAME };
  const currentUslt = usltFrames[activeIndex] || { ...DEFAULT_USLT_FRAME };

  const handleAddGroup = () => {
    onSyltFramesChange(prev => [...prev, { ...DEFAULT_SYLT_FRAME }]);
    onUsltFramesChange(prev => [...prev, { ...DEFAULT_USLT_FRAME }]);
    setActiveIndex(syltFrames.length); // This is still fine; syltFrames.length is previous
    setLrcText("");
  };
  
  const handleDeleteGroup = (idx: number) => {
    if (syltFrames.length < 2) return;
    onSyltFramesChange(prev => prev.filter((_, i) => i !== idx));
    onUsltFramesChange(prev => prev.filter((_, i) => i !== idx));
    setActiveIndex(idx > 0 ? idx - 1 : 0);
    setLrcText("");
  };

  // Switch active group
  const handleSwitchGroup = (idx: number) => {
    setActiveIndex(idx);
    setLrcText("");
  };

  const handleSyltField = (field: keyof SYLTFrame, value: any) => {
    onSyltFramesChange(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], [field]: value };
      return next;
    });
  };
  
  const handleUsltField = (field: keyof USLTFrame, value: any) => {
    onUsltFramesChange(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], [field]: value };
      return next;
    });
  };
  
  const handleAddEntry = () => {
    onSyltFramesChange(prev => {
      const next = [...prev];
      next[activeIndex].text.push(["", 0]);
      return next;
    });
  };
  
  const handleUpdateEntry = (idx: number, text: string, time: number) => {
    onSyltFramesChange(prev => {
      const next = [...prev];
      next[activeIndex].text[idx] = [text, time];
      return next;
    });
  };
  
  const handleDeleteEntry = (idx: number) => {
    onSyltFramesChange(prev => {
      const next = [...prev];
      next[activeIndex].text.splice(idx, 1);
      return next;
    });
  };

  // LRC text import for current group
  const handleLrcImport = () => {
    const parsed = parseLRCFormat(lrcText);
    if (!parsed.length) return;
    handleSyltField("text", parsed.map(([text, timestamp]) => [text, timestamp]));
    setShowLrcImport(false);
    setLrcText("");
  };

  // LRC file upload
  const handleLrcFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = await parseLRCFile(file);
    setLrcText(parsed.map(([text, time]) => `[${new Date(time).toISOString().slice(14, 23)}]${text}`).join("\n"));
    setShowLrcImport(true);
    e.target.value = "";
  };

  // USLT: fallback from SYLT if blank
  const autoUSLT = (currentSylt.text || []).map(([t]) => t).join("\n");

  // Tabs to switch groups
  const renderGroupTabs = () => (
    <div className="flex flex-wrap gap-2 mb-3">
      {syltFrames.map((g, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleSwitchGroup(i)}
          className={`btn px-3 py-1 text-xs ${activeIndex === i ? "bg-primary/20 border-primary" : "bg-background border-input/50"} border rounded-full`}
          data-variant={activeIndex === i ? "solid" : "soft"}
        >
          {g.language || "eng"}
          {syltFrames.length > 1 && (
            <span
              className="ml-1 text-danger cursor-pointer"
              title="Delete group"
              onClick={e => {
                e.stopPropagation();
                handleDeleteGroup(i);
              }}
            >
              <Trash2 className="inline h-3 w-3" />
            </span>
          )}
        </button>
      ))}
      <button
        type="button"
        className="btn"
        data-variant="soft"
        data-tone="primary"
        data-size="xs"
        onClick={handleAddGroup}
      >
        <Plus className="h-4 w-4 icon-accent" /> Add group
      </button>
    </div>
  );

  return (
    <section className="glass-panel p-6 sm:p-8">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div>
            <p className="micro-label">Lyrics</p>
            <h2 className="text-xl font-semibold">Lyrics & Sync</h2>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {currentSylt.text?.length || 0} entries
          </span>
        </div>
        {renderGroupTabs()}
      </div>
      <div className="space-y-4">
        {/* Upload LRC file */}
        <div className="flex gap-2 mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".lrc,text/plain"
            style={{ display: "none" }}
            onChange={handleLrcFileUpload}
          />
          <button
            type="button"
            className="btn"
            data-variant="soft"
            data-tone="primary"
            data-size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-4 w-4 icon-accent" />
            Upload LRC file
          </button>
          <button
            type="button"
            className="btn"
            data-variant="soft"
            data-tone="primary"
            data-size="sm"
            onClick={() => setShowLrcImport(v => !v)}
          >
            <Upload className="h-4 w-4 icon-accent" />
            Paste LRC text
          </button>
        </div>
        {showLrcImport && (
          <div className="space-y-2 mb-2">
            <label className="block text-sm font-semibold text-foreground/80 mb-1">
              Paste or edit LRC content:
            </label>
            <textarea
              value={lrcText}
              onChange={e => setLrcText(e.target.value)}
              rows={4}
              placeholder="[00:01.40]First line\n[00:08.50]Next line"
              className="w-full border border-input/80 bg-background/50 focus:bg-background rounded-md px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              className="btn"
              data-variant="solid"
              data-tone="primary"
              data-size="sm"
              onClick={handleLrcImport}
              disabled={!lrcText.trim()}
            >
              Convert &amp; Import to current group
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-foreground/70">
              Language
            </label>
            <input
              value={currentSylt.language || ""}
              onChange={e => handleSyltField("language", e.target.value)}
              placeholder="eng"
              maxLength={3}
              className="w-full border border-input/80 bg-background/50 focus:bg-background rounded-md px-3 py-2 text-sm uppercase tracking-widest"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-foreground/70">
              Description
            </label>
            <input
              value={currentSylt.description || ""}
              onChange={e => handleSyltField("description", e.target.value)}
              placeholder="Lyrics"
              className="w-full border border-input/80 bg-background/50 focus:bg-background rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold tracking-wide text-foreground/70">
                Unsynced Lyrics
              </label>
              <span className="text-xs text-muted-foreground text-right">
                Leave blank to auto-fill from the synced lines above.
              </span>
            </div>
            <textarea
              value={currentUslt.lyrics || autoUSLT}
              onChange={e => handleUsltField("lyrics", e.target.value)}
              rows={4}
              placeholder="Paste the full lyric sheet if you don’t need timestamps."
              className="w-full border border-input/80 bg-background/50 focus:bg-background rounded-md px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-semibold tracking-wide text-foreground/70">
              Timeline Entries
            </label>
            <button
              onClick={handleAddEntry}
              className="btn"
              data-variant="soft"
              data-tone="primary"
              data-size="sm"
              type="button"
            >
              <Plus className="h-4 w-4 icon-accent" />
              Add Entry
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {currentSylt.text?.map((entry, index) => (
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
    </section>
  );
}

interface LyricEntryProps {
  index: number;
  text: string;
  timestamp: number;
  onUpdate: (index: number, text: string, timestamp: number) => void;
  onDelete: (index: number) => void;
}

function LyricEntry({
  index,
  text,
  timestamp,
  onUpdate,
  onDelete,
}: LyricEntryProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-input/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:gap-3">
      <input
        value={text}
        onChange={e => onUpdate(index, e.target.value, timestamp)}
        placeholder="Lyrics text"
        className="flex-1 border border-input/60 rounded-md px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 icon-accent" />
        <input
          type="number"
          value={timestamp}
          onChange={e => onUpdate(index, text, parseInt(e.target.value) || 0)}
          placeholder="ms"
          className="w-24 border border-input/60 rounded-md px-2 py-2 text-sm"
        />
      </div>
      <button
        onClick={() => onDelete(index)}
        className="btn"
        data-variant="soft"
        data-tone="danger"
        data-size="sm"
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
