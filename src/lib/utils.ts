import { clsx, type ClassValue } from 'clsx';
import PostalMime from 'postal-mime';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getFileContent(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (!content) {
        return rej('File has no content');
      }
      res(content.toString());
    };
    reader.readAsText(file);
  });
}

export function decodeMimeEncodedText(encodedText: string) {
  const matches = encodedText.match(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=(.*)/);
  if (!matches) return encodedText; // Return as is if no match is found

  const charset = matches[1]; // Extract the character set (e.g., UTF-8)
  const encoding = matches[2].toUpperCase(); // Encoding type: Q (Quoted-Printable) or B (Base64)
  const encodedContent = matches[3];

  if (encoding === 'Q') {
    // Decode Quoted-Printable
    const decoded = encodedContent
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))); // Decode =XX to characters
    const remainingText = matches[4] ? matches[4].trim() : ''; // Capture any text after the encoded part
    return new TextDecoder(charset).decode(
      new Uint8Array([...decoded].map((c) => c.charCodeAt(0)))
    ) + remainingText;
  } else if (encoding === 'B') {
    // Decode Base64
    const decoded = atob(encodedContent); // Decode Base64
    return new TextDecoder(charset).decode(
      new Uint8Array([...decoded].map((c) => c.charCodeAt(0)))
    );
  }

  return encodedText; // Return the original text if unhandled encoding
}
