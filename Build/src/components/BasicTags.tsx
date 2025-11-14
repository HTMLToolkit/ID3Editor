interface BasicTagsSectionProps {
  tags: ID3Tags;
  onTagChange: (field: keyof ID3Tags, value: string) => void;
}

const TAG_FIELDS = [
  { key: 'title' as const, label: 'Title', placeholder: 'Song title' },
  { key: 'artist' as const, label: 'Artist', placeholder: 'Artist name' },
  { key: 'album' as const, label: 'Album', placeholder: 'Album name' },
  { key: 'year' as const, label: 'Year', placeholder: '2024' },
] as const;

export function BasicTagsSection({ tags, onTagChange }: BasicTagsSectionProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Basic ID3 Tags</h2>
      <div className="grid grid-cols-2 gap-4">
        {TAG_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <label htmlFor={key} className="text-sm font-medium">
              {label}
            </label>
            <input
              id={key}
              value={tags[key] || ''}
              onChange={(e) => onTagChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}