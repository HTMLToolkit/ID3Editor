import { useState, useCallback, useEffect } from 'react';
import { Music, Bug } from 'lucide-react';
import { FileUploadSection } from './Upload';
import { BasicTagsSection } from './BasicTags';
import { AlbumArtSection } from './AlbumArt';
import { SyncedLyricsSection } from './SyncedLyrics';
import { LrcImportSection } from './Import';
import { ProcessButton } from './Process';
import { AlertMessage } from './Alert';
import { useID3Processor } from '../hooks/useID3Processor';
import { useLRCParser } from '../hooks/useLRCParser';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<ID3Tags>({});
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [syltFrame, setSyltFrame] = useState<SYLTFrame>({
    type: 1,
    text: [],
    timestampFormat: 2,
    language: 'eng',
    description: 'Lyrics'
  });
  const [lrcText, setLrcText] = useState<string>('');
  const [showEruda, setShowEruda] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { isProcessing, processFile } = useID3Processor();
  const { parseLRCFormat } = useLRCParser();

  useEffect(() => {
    if (typeof window !== 'undefined' && showEruda) {
      import('eruda').then(eruda => {
        eruda.default.init();
        eruda.default.show();
      });
    }
  }, [showEruda]);

  const handleFileUpload = useCallback((uploadedFile: File | null) => {
    if (uploadedFile && uploadedFile.type === 'audio/mpeg') {
      setFile(uploadedFile);
      setError(null);
      setSuccess('File loaded successfully! Ready to edit tags.');
    } else {
      setError('Please upload a valid MP3 file');
    }
  }, []);

  const handleTagChange = (field: keyof ID3Tags, value: string) => {
    setTags(prev => ({ ...prev, [field]: value }));
  };

  const handleLRCImport = () => {
    if (lrcText.trim()) {
      const entries = parseLRCFormat(lrcText);
      setSyltFrame(prev => ({ ...prev, text: entries }));
      setLrcText('');
      setSuccess('LRC format lyrics imported successfully!');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setError(null);
    setSuccess(null);
    
    const result = await processFile(file, tags, syltFrame, albumArtUrl);
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  const handleSYLTChange = (updatedText: [string, number][]) => {
    setSyltFrame(prev => ({ ...prev, text: updatedText }));
  };

  const handleSYLTMetadataChange = (field: 'language' | 'description', value: string) => {
    setSyltFrame(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Debug Controls */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowEruda(!showEruda)}
          className="bg-background/80 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <Bug className="h-4 w-4 inline mr-2" />
          {showEruda ? 'Hide' : 'Show'} Debug
        </button>
      </div>

      {/* Header */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-6 w-6" />
          <h1 className="text-2xl font-bold">ID3Editor</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Edit all your ID3 tags including synced lyrics (SYLT) and album art directly in the browser.
        </p>

        {/* Messages */}
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        <FileUploadSection file={file} onFileUpload={handleFileUpload} />
      </div>

      {/* LRC Import Section */}
      <LrcImportSection 
        lrcText={lrcText}
        onLrcTextChange={setLrcText}
        onImport={handleLRCImport}
      />

      {/* Basic Tags */}
      <BasicTagsSection tags={tags} onTagChange={handleTagChange} />

      {/* Album Art */}
      <AlbumArtSection albumArtUrl={albumArtUrl} onAlbumArtChange={setAlbumArtUrl} />

      {/* Synced Lyrics */}
      <SyncedLyricsSection
        syltFrame={syltFrame}
        onTextChange={handleSYLTChange}
        onMetadataChange={handleSYLTMetadataChange}
      />

      {/* Process Button */}
      <ProcessButton
        disabled={!file || isProcessing}
        isProcessing={isProcessing}
        fileName={file?.name}
        onProcess={handleProcess}
      />
    </div>
  );
}