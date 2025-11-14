interface ID3Tags {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
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