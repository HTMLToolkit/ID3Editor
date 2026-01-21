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

  // Defensive group index handling
  const safeActiveIndex =
    syltFrames.length > 0 && activeIndex >= 0 && activeIndex < syltFrames.length
      ? activeIndex
      : 0;

  // Defensive frame fallback
  const currentSylt = syltFrames[safeActiveIndex] ?? { ...DEFAULT_SYLT_FRAME };
  const currentUslt = usltFrames[safeActiveIndex] ?? { ...DEFAULT_USLT_FRAME };

  // Defensive for autoUSLT
  const autoUSLT = Array.isArray(currentSylt.text)
    ? currentSylt.text
        .filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === "string" &&
            typeof entry[1] === "number"
        )
        .map(([t]) => t)
        .join("\n")
    : "";

  function renderGroupTabs() {
    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {syltFrames.map((g, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSwitchGroup(i)}
            className={`btn px-3 py-1 text-xs ${safeActiveIndex === i ? "bg-primary/20 border-primary" : "bg-background border-input/50"} border rounded-full`}
            data-variant={safeActiveIndex === i ? "solid" : "soft"}
          >
            {g.language || "eng"}
            {syltFrames.length > 1 && (
              <span
                className="ml-1 text-danger cursor-pointer"
                title="Delete group"
                onClick={(e) => {
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
  }

  // Add a new lyric group (both SYLT/USLT)
  function handleAddGroup() {
    onSyltFramesChange((prev) => [...prev, { ...DEFAULT_SYLT_FRAME }]);
    onUsltFramesChange((prev) => [...prev, { ...DEFAULT_USLT_FRAME }]);
    setActiveIndex(syltFrames.length); // next index
    setLrcText("");
  }

  // Delete group, always keep at least one
  function handleDeleteGroup(idx: number) {
    if (syltFrames.length <= 1) return;
    const newSylt = syltFrames.filter((_, i) => i !== idx);
    const newUslt = usltFrames.filter((_, i) => i !== idx);
    onSyltFramesChange(newSylt);
    onUsltFramesChange(newUslt);
    setActiveIndex(idx > 0 ? idx - 1 : 0);
    setLrcText("");
  }

  function handleSwitchGroup(idx: number) {
    setActiveIndex(
      syltFrames.length > 0
        ? Math.max(0, Math.min(idx, syltFrames.length - 1))
        : 0
    );
    setLrcText("");
  }

  function handleSyltField(field: keyof SYLTFrame, value: any) {
    onSyltFramesChange((prev) => {
      if (prev.length === 0) return [{ ...DEFAULT_SYLT_FRAME, [field]: value }];
      return prev.map((frame, i) =>
        i === safeActiveIndex ? { ...frame, [field]: value } : frame
      );
    });
  }

  function handleUsltField(field: keyof USLTFrame, value: any) {
    onUsltFramesChange((prev) => {
      if (prev.length === 0) return [{ ...DEFAULT_USLT_FRAME, [field]: value }];
      return prev.map((frame, i) =>
        i === safeActiveIndex ? { ...frame, [field]: value } : frame
      );
    });
  }

  function handleAddEntry() {
    onSyltFramesChange((prev) => {
      return prev.map((frame, i) =>
        i === safeActiveIndex
          ? {
              ...frame,
              text: [...(frame.text ?? []), ["", 0] as [string, number]],
            }
          : frame
      );
    });
  }

  function handleUpdateEntry(entryIdx: number, text: string, time: number) {
    onSyltFramesChange((prev) => {
      return prev.map((frame, i) => {
        if (i !== safeActiveIndex) return frame;
        const nextText = Array.isArray(frame.text) ? [...frame.text] : [];
        nextText[entryIdx] = [text, time];
        // Filter to ensure all entries are [string, number]
        const cleanText = nextText.filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === "string" &&
            typeof entry[1] === "number"
        );
        return { ...frame, text: cleanText };
      });
    });
  }

  function handleDeleteEntry(entryIdx: number) {
    onSyltFramesChange((prev) => {
      return prev.map((frame, i) => {
        if (i !== safeActiveIndex) return frame;
        const nextText = Array.isArray(frame.text) ? [...frame.text] : [];
        nextText.splice(entryIdx, 1);
        const cleanText = nextText.filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === "string" &&
            typeof entry[1] === "number"
        );
        return { ...frame, text: cleanText };
      });
    });
  }

  function handleLrcImport() {
    const parsed = parseLRCFormat(lrcText);
    // Filter for valid tuples
    const valid = parsed.filter(
      (entry): entry is [string, number] =>
        Array.isArray(entry) &&
        entry.length === 2 &&
        typeof entry[0] === "string" &&
        typeof entry[1] === "number"
    );
    if (!valid.length) return;
    handleSyltField("text", valid);
    setShowLrcImport(false);
    setLrcText("");
  }

  async function handleLrcFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = await parseLRCFile(file);
    // Defensive formatting (always tuples)
    setLrcText(
      parsed
        .filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === "string" &&
            typeof entry[1] === "number"
        )
        .map(([text, time]) => `[${formatMs(time)}]${text}`)
        .join("\n")
    );
    setShowLrcImport(true);
    e.target.value = "";
  }

  function formatMs(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const centiseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
    return `${minutes}:${seconds}.${centiseconds}`;
  }

  // Lyric entry subcomponent
  function LyricEntry({
    index,
    text,
    timestamp,
    onUpdate,
    onDelete,
  }: {
    index: number;
    text: string;
    timestamp: number;
    onUpdate: (index: number, text: string, timestamp: number) => void;
    onDelete: (index: number) => void;
  }) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-input/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:gap-3">
        <input
          value={text}
          onChange={(e) => onUpdate(index, e.target.value, timestamp)}
          placeholder="Lyrics text"
          className="flex-1 border border-input/60 rounded-md px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 icon-accent" />
          <input
            type="number"
            value={timestamp}
            onChange={(e) => onUpdate(index, text, Number(e.target.value) || 0)}
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

  return (
    <section className="glass-panel p-6 sm:p-8">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div>
            <p className="micro-label">Lyrics</p>
            <h2 className="text-xl font-semibold">Lyrics & Sync</h2>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {Array.isArray(currentSylt.text) ? currentSylt.text.length : 0}{" "}
            entries
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
            onClick={() => setShowLrcImport((v) => !v)}
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
              onChange={(e) => setLrcText(e.target.value)}
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
              onChange={(e) => handleSyltField("language", e.target.value)}
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
              onChange={(e) => handleSyltField("description", e.target.value)}
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
              onChange={(e) => handleUsltField("lyrics", e.target.value)}
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
            {Array.isArray(currentSylt.text) &&
              currentSylt.text
                .filter(
                  (entry): entry is [string, number] =>
                    Array.isArray(entry) &&
                    entry.length === 2 &&
                    typeof entry[0] === "string" &&
                    typeof entry[1] === "number"
                )
                .map((entry, index) => (
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
