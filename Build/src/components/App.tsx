import { useState, useCallback, useEffect } from 'react';
import { Upload, Download, Music, Clock, FileText, Plus, Trash2, Bug } from 'lucide-react';

interface ID3Tags {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  track?: string;
  comment?: string;
}

interface SYLTFrame {
  type: number;
  text: [string, number][];
  timestampFormat: number;
  language: string;
  description: string;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tags, setTags] = useState<ID3Tags>({});
  const [syltFrame, setSyltFrame] = useState<SYLTFrame>({
    type: 1,
    text: [],
    timestampFormat: 2,
    language: 'eng',
    description: 'Lyrics'
  });
  const [lrcText, setLrcText] = useState<string>('');
  const [showEruda, setShowEruda] = useState(false);

  // Initialize eruda
  useEffect(() => {
    if (typeof window !== 'undefined' && showEruda) {
      import('eruda').then(eruda => {
        eruda.default.init();
        eruda.default.show();
      });
    }
  }, [showEruda]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'audio/mpeg') {
      setFile(uploadedFile);
      setError(null);
      setSuccess(null);
      setSuccess('File loaded successfully! Ready to edit tags.');
    } else {
      setError('Please upload a valid MP3 file');
    }
  }, []);

  const handleTagChange = (field: keyof ID3Tags, value: string) => {
    setTags(prev => ({ ...prev, [field]: value }));
  };

  const parseLRCFormat = (lrcContent: string) => {
    const lines = lrcContent.split('\n');
    const entries: [string, number][] = [];
    
    console.log('Parsing LRC content:', lrcContent);
    console.log('Lines to process:', lines);
    
    lines.forEach((line, index) => {
      // Handle both [mm:ss.xx] and [mm:ss:xx] formats
      const match = line.match(/\[(\d{2}):(\d{2})[:.](\d{2})\](.*)/);
      console.log(`Line ${index}: "${line}"`, match);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const centiseconds = parseInt(match[3]);
        const timestamp = minutes * 60 * 1000 + seconds * 1000 + centiseconds * 10;
        const text = match[4].trim();
        console.log(`Parsed: minutes=${minutes}, seconds=${seconds}, centiseconds=${centiseconds}, timestamp=${timestamp}, text="${text}"`);
        
        // Add entry even if text is empty (some players want empty timestamps)
        entries.push([text, timestamp]);
      }
    });
    
    // Sort by timestamp
    entries.sort((a, b) => a[1] - b[1]);
    
    console.log('Final LRC entries:', entries);
    
    setSyltFrame(prev => ({
      ...prev,
      text: entries
    }));
  };

  const handleLRCImport = () => {
    if (lrcText.trim()) {
      parseLRCFormat(lrcText);
      setLrcText('');
      setSuccess('LRC format lyrics imported successfully! Check the synced lyrics section to see the parsed entries.');
    }
  };

  const addSampleSYLT = () => {
    const sampleEntries: [string, number][] = [
      ["Hello world", 1000],
      ["This is a test", 2000],
      ["SYLT lyrics working", 3000]
    ];
    setSyltFrame(prev => ({
      ...prev,
      text: sampleEntries
    }));
    console.log('Added sample SYLT entries:', sampleEntries);
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Starting client-side ID3 processing...');
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('File read, size:', arrayBuffer.byteLength);
      
      // Dynamically import browser-id3-writer to avoid SSR issues
      console.log('Importing browser-id3-writer...');
      const id3Module = await import('browser-id3-writer');
      console.log('ID3 module:', id3Module);
      console.log('ID3Writer constructor:', id3Module.ID3Writer);
      
      const { ID3Writer } = id3Module;
      const writer = new ID3Writer(arrayBuffer);
      console.log('ID3Writer created:', writer);
      
      // Set basic tags using supported frames
      if (tags.title) {
        console.log('Setting title:', tags.title);
        (writer as any).setFrame('TIT2', tags.title);
      }
      if (tags.artist) {
        console.log('Setting artist:', tags.artist);
        (writer as any).setFrame('TPE1', [tags.artist]);
      }
      if (tags.album) {
        console.log('Setting album:', tags.album);
        (writer as any).setFrame('TALB', tags.album);
      }

      // Set SYLT frame (synchronized lyrics)
      if (syltFrame.text && syltFrame.text.length > 0) {
        console.log('Setting SYLT frame with', syltFrame.text.length, 'entries');
        
        const formattedText = syltFrame.text.map(([text, timestamp]) => [
          String(text || ''),
          Math.floor(Number(timestamp || 0))
        ]);
        
        if (formattedText.length > 0) {
          (writer as any).setFrame('SYLT', {
            type: 1,
            text: formattedText,
            timestampFormat: 2,
            language: syltFrame.language || 'eng',
            description: syltFrame.description || 'Synced Lyrics'
          });
          
          console.log('SYLT frame set successfully');
        }
      }

      writer.addTag();
      console.log('Tag added successfully');
      
      const outputBuffer = (writer as any).arrayBuffer;
      console.log('Output buffer retrieved, size:', outputBuffer.byteLength);
      
      // Create blob and download
      const blob = new Blob([outputBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tags.title || file.name.replace('.mp3', '')}_tagged.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('File processed successfully!');
      console.log('File download completed');
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
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

      <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-6 w-6" />
          <h1 className="text-2xl font-bold">ID3 Tag Editor - Vanilla React</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Edit MP3 metadata including synchronized (SYLT) lyrics - entirely in your browser
        </p>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Upload MP3 File
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="audio/mpeg"
                onChange={handleFileUpload}
                className="flex-1 border border-input rounded-md px-3 py-2 text-sm"
              />
              {file && (
                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {file.name}
                </span>
              )}
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-destructive/15 text-destructive border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-800 border border-green-200 rounded-md p-3">
              {success}
            </div>
          )}

          {/* LRC Import Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">LRC Format Lyrics</label>
            <textarea
              placeholder="[00:01.40]どうしてすぐ知ってしまうの&#10;[00:02.75]共振で苦しんでし罵倒&#10;[00:04.10]Q.更新で降る隕石抹消可？&#10;[00:05.91]悪くない"
              value={lrcText}
              onChange={(e) => setLrcText(e.target.value)}
              rows={8}
              className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleLRCImport}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 text-sm flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import LRC
              </button>
              <button
                onClick={addSampleSYLT}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 text-sm"
              >
                Load Example
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Tags */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Basic ID3 Tags</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input
              id="title"
              value={tags.title || ''}
              onChange={(e) => handleTagChange('title', e.target.value)}
              placeholder="Song title"
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="artist" className="text-sm font-medium">Artist</label>
            <input
              id="artist"
              value={tags.artist || ''}
              onChange={(e) => handleTagChange('artist', e.target.value)}
              placeholder="Artist name"
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="album" className="text-sm font-medium">Album</label>
            <input
              id="album"
              value={tags.album || ''}
              onChange={(e) => handleTagChange('album', e.target.value)}
              placeholder="Album name"
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="year" className="text-sm font-medium">Year</label>
            <input
              id="year"
              value={tags.year || ''}
              onChange={(e) => handleTagChange('year', e.target.value)}
              placeholder="2024"
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Synced Lyrics */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Synchronized Lyrics (SYLT)</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <input
                value={syltFrame.language}
                onChange={(e) => setSyltFrame(prev => ({ ...prev, language: e.target.value }))}
                placeholder="eng"
                maxLength={3}
                className="w-full border border-input rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <input
                value={syltFrame.description}
                onChange={(e) => setSyltFrame(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Synced Lyrics"
                className="w-full border border-input rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Lyrics Entries</label>
              <button
                onClick={() => setSyltFrame(prev => ({
                  ...prev,
                  text: [...prev.text, ['', 0]]
                }))}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1 text-sm"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Add Entry
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {syltFrame.text.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                  <input
                    value={entry[0]}
                    onChange={(e) => setSyltFrame(prev => ({
                      ...prev,
                      text: prev.text.map((item, i) => 
                        i === index ? [e.target.value, item[1]] : item
                      )
                    }))}
                    placeholder="Lyrics text"
                    className="flex-1 border border-input rounded px-2 py-1 text-sm"
                  />
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={entry[1]}
                      onChange={(e) => setSyltFrame(prev => ({
                        ...prev,
                        text: prev.text.map((item, i) => 
                          i === index ? [item[0], parseInt(e.target.value) || 0] : item
                        )
                      }))}
                      placeholder="ms"
                      className="w-20 border border-input rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setSyltFrame(prev => ({
                      ...prev,
                      text: prev.text.filter((_, i) => i !== index)
                    }))}
                    className="bg-destructive text-destructive-foreground rounded px-2 py-1 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
        <div className="flex justify-center">
          <button
            onClick={processFile}
            disabled={!file || isProcessing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
}