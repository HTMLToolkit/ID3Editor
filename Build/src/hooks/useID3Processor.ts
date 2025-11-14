import { useState } from 'react';

interface ProcessResult {
  success: boolean;
  message: string;
}

export function useID3Processor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (
    file: File,
    tags: ID3Tags,
    syltFrame: SYLTFrame
  ): Promise<ProcessResult> => {
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const id3Module = await import('browser-id3-writer');
      const { ID3Writer } = id3Module;
      const writer = new ID3Writer(arrayBuffer);

      // Set basic tags
      if (tags.title) {
        (writer as any).setFrame('TIT2', tags.title);
      }
      if (tags.artist) {
        (writer as any).setFrame('TPE1', [tags.artist]);
      }
      if (tags.album) {
        (writer as any).setFrame('TALB', tags.album);
      }

      // Set SYLT frame
      if (syltFrame.text.length > 0) {
        const formattedText = syltFrame.text.map(([text, timestamp]) => [
          String(text || ''),
          Math.floor(Number(timestamp || 0))
        ]);

        (writer as any).setFrame('SYLT', {
          type: 1,
          text: formattedText,
          timestampFormat: 2,
          language: syltFrame.language || 'eng',
          description: syltFrame.description || 'Synced Lyrics'
        });
      }

      writer.addTag();

      const outputBuffer = (writer as any).arrayBuffer;
      const blob = new Blob([outputBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tags.title || file.name.replace('.mp3', '')}_tagged.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'File processed and downloaded successfully!'
      };
    } catch (err) {
      console.error('Error processing file:', err);
      return {
        success: false,
        message: `Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, processFile };
}