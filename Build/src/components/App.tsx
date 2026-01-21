import { useState, useCallback, useEffect, useRef } from "react";
import { Music, Bug } from "lucide-react";
import { FileUploadSection } from "./Upload";
import { BasicTagsSection } from "./BasicTags";
import { AlbumArtSection } from "./AlbumArt";
import { SyncedLyricsSection } from "./SyncedLyrics";
import { ProcessButton } from "./Process";
import { AlertMessage } from "./Alert";
import { ThemeToggle } from "./ThemeToggle";
import { useID3Processor } from "../hooks/useID3Processor";
import {
  useID3Loader,
  DEFAULT_SYLT_FRAME,
  DEFAULT_USLT_FRAME,
} from "../hooks/useID3Loader";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<ID3Tags>({});
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [syltFrames, setSyltFrames] = useState<SYLTFrame[]>([]);
  const [usltFrames, setUsltFrames] = useState<USLTFrame[]>([]);
  const [showEruda, setShowEruda] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [metadataSummary, setMetadataSummary] = useState("");

  const { isProcessing, processFile } = useID3Processor();
  const { isLoading: isReadingMetadata, loadMetadata } = useID3Loader();
  const activeFileSignature = useRef("");

  const buildFileSignature = useCallback(
    (target: File) => `${target.name}:${target.lastModified}:${target.size}`,
    []
  );

  useEffect(() => {
    if (typeof window !== "undefined" && showEruda) {
      import("eruda").then((eruda) => {
        eruda.default.init();
        eruda.default.show();
      });
    }
  }, [showEruda]);

  const handleFileUpload = useCallback(
    async (uploadedFile: File | null) => {
      if (!uploadedFile) {
        activeFileSignature.current = "";
        setFile(null);
        setTags({});
        setAlbumArtUrl(null);
        setSyltFrames([]);
        setUsltFrames([]);
        setMetadataSummary("");
        setSuccess(null);
        setError(null);
        return;
      }

      const acceptsMp3 =
        uploadedFile.type === "audio/mpeg" ||
        uploadedFile.type === "audio/mp3" ||
        uploadedFile.name.toLowerCase().endsWith(".mp3");

      if (!acceptsMp3) {
        setError("Please upload a valid MP3 file");
        setSuccess(null);
        return;
      }

      const signature = buildFileSignature(uploadedFile);
      activeFileSignature.current = signature;

      setFile(uploadedFile);
      setError(null);
      setSuccess("File loaded. Reading embedded tags...");
      setMetadataSummary("Scanning embedded metadata...");
      setTags({});
      setAlbumArtUrl(null);
      setSyltFrames([]);
      setUsltFrames([]);

      try {
        const {
          tags: parsedTags,
          albumArtUrl: parsedAlbumArt,
          syltFrames: parsedSyltFrames,
          usltFrames: parsedUsltFrames,
        } = await loadMetadata(uploadedFile);

        if (activeFileSignature.current !== signature) {
          return;
        }

        setTags(parsedTags);
        setAlbumArtUrl(parsedAlbumArt);
        setSyltFrames(
          parsedSyltFrames?.length
            ? parsedSyltFrames
            : [{ ...DEFAULT_SYLT_FRAME }]
        );
        setUsltFrames(
          parsedUsltFrames?.length
            ? parsedUsltFrames
            : [{ ...DEFAULT_USLT_FRAME }]
        );

        const importedFieldCount = Object.values(parsedTags).filter(
          (value) => typeof value === "string" && value.trim().length > 0
        ).length;
        const importedLyricsLines =
          parsedSyltFrames?.reduce((acc, f) => acc + f.text.length, 0) ?? 0;
        const hasImportedData =
          importedFieldCount > 0 ||
          Boolean(parsedAlbumArt) ||
          (parsedSyltFrames && importedLyricsLines > 0);

        setMetadataSummary(
          importedFieldCount > 0
            ? `Imported ${importedFieldCount} embedded tag${importedFieldCount === 1 ? "" : "s"}.`
            : "No embedded tags found."
        );

        setSuccess(
          hasImportedData
            ? "Existing metadata imported. Continue editing below."
            : "File loaded. Add or update tags below."
        );
      } catch (loaderErr) {
        if (activeFileSignature.current !== signature) {
          return;
        }
        console.error("Failed to parse metadata", loaderErr);
        setMetadataSummary("");
        setError(
          "Loaded file, but could not read embedded metadata automatically."
        );
        setSuccess(null);
      }
    },
    [loadMetadata, buildFileSignature]
  );

  const handleTagChange = (field: keyof ID3Tags, value: string) => {
    setTags((prev) => ({ ...prev, [field]: value }));
  };

  const handleProcess = async () => {
    if (!file) return;
    setError(null);
    setSuccess(null);

    // Make sure tags.usltFrames is in sync for processor
    setTags((prev) => ({
      ...prev,
      usltFrames: usltFrames,
      syltFrames: syltFrames,
    }));

    const result = await processFile(
      file,
      { ...tags, usltFrames, syltFrames },
      syltFrames,
      albumArtUrl
    );

    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  const populatedFields = Object.entries(tags).filter(([, value]) => {
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    return false;
  }).length;

  const sessionStats = [
    {
      label: "Tag fields set",
      value: populatedFields.toString(),
      helper: "metadata saved this session",
    },
    {
      label: "Synced lines",
      value: syltFrames
        .reduce((sum, f) => sum + (f.text.length || 0), 0)
        .toString(),
      helper: "timestamped lyric rows (all frames)",
    },
    {
      label: "Artwork",
      value: albumArtUrl ? "Attached" : "Not added",
      helper: albumArtUrl ? "Cover ready to embed" : "Add PNG / JPG / WebP",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full blur-3xl opacity-60"
        style={{ backgroundImage: "var(--themegradient-active)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[140px] opacity-40"
        style={{ backgroundImage: "var(--themegradient-active)" }}
      />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-6">
        {/* Hero */}
        <section className="glass-panel p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 lg:max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/12 p-3 text-primary shadow-inner shadow-primary/30">
                  <Music className="h-6 w-6 icon-accent" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold hero-title">
                    <span className="gradient-text inline-block">
                      ID3Editor
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Tag MP3s, embed art, and sync lyrics without leaving your
                    browser.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-4 lg:max-w-xs">
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-right shadow-inner shadow-primary/10">
                <p className="micro-label justify-end text-primary/80">
                  Current file
                </p>
                <p
                  className={`text-2xl font-semibold ${file ? "text-primary" : "text-muted-foreground"}`}
                >
                  {file ? file.name : "No file loaded"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file
                    ? "Ready for metadata tweaks."
                    : "Load an MP3 to unlock controls."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <ThemeToggle />
                <button
                  onClick={() => setShowEruda(!showEruda)}
                  type="button"
                  className="btn w-full"
                  data-variant="soft"
                  data-size="sm"
                  data-tone="secondary"
                >
                  <Bug className="h-4 w-4 icon-accent" />
                  {showEruda ? "Hide" : "Show"} Debug
                </button>
              </div>
            </div>
          </div>

          {error && <AlertMessage type="error" message={error} />}
          {success && <AlertMessage type="success" message={success} />}

          <FileUploadSection
            file={file}
            onFileUpload={handleFileUpload}
            isParsingMetadata={isReadingMetadata}
            metadataSummary={metadataSummary}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sessionStats.map(({ label, value, helper }) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-xl border px-4 py-3 text-sm text-white shadow-lg shadow-primary/30"
                style={{
                  backgroundImage:
                    "var(--stat-card-gradient, var(--themegradient-active))",
                  borderColor: "var(--stat-card-border, transparent)",
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-black/10" />
                <div className="relative space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    {label}
                  </p>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-xs text-white/80">{helper}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Basic Tags */}
        <BasicTagsSection tags={tags} onTagChange={handleTagChange} />

        {/* Album Art */}
        <AlbumArtSection
          albumArtUrl={albumArtUrl}
          onAlbumArtChange={setAlbumArtUrl}
        />

        {/* Synced Lyrics */}
        <SyncedLyricsSection
          syltFrames={syltFrames}
          onSyltFramesChange={setSyltFrames}
          usltFrames={usltFrames}
          onUsltFramesChange={setUsltFrames}
        />

        {/* Process Button */}
        <ProcessButton
          disabled={!file || isProcessing}
          isProcessing={isProcessing}
          fileName={file?.name}
          onProcess={handleProcess}
        />
      </main>
    </div>
  );
}
