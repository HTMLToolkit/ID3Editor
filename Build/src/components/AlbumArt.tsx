import { Image, Trash2, Upload } from 'lucide-react';

interface AlbumArtSectionProps {
  albumArtUrl: string | null;
  onAlbumArtChange: (url: string | null) => void;
}

export function AlbumArtSection({ albumArtUrl, onAlbumArtChange }: AlbumArtSectionProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        onAlbumArtChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Album Art</h2>
      <div className="space-y-4">
        {albumArtUrl ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img
                src={albumArtUrl}
                alt="Album Art"
                className="max-w-xs max-h-xs rounded-md border border-input"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <label className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 text-sm flex items-center cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => onAlbumArtChange(null)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-4 py-2 text-sm flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="border-2 border-dashed border-input rounded-md p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <Image className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload album art</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}