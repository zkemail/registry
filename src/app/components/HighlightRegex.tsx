import React from 'react';

const HighlightText = ({ text, regexList }: { text: string; regexList: any[] }) => {
  const highlightText = (text: string) => {
    let segments: { text: string; key: number; highlight?: boolean; color?: string }[] = [
      { text, key: 0 },
    ]; // Start with the entire text as a single segment

    regexList.forEach(({ regex, color }, index) => {
      const newSegments: { text: string; key: number; highlight?: boolean; color?: string }[] = [];
      segments.forEach((segment) => {
        if (segment.highlight) {
          // Already highlighted segments remain as-is
          newSegments.push(segment);
        } else {
          // Split and apply highlights for the current regex
          const parts = segment.text.split(regex);
          let key = segment.key;

          parts.forEach((part: string, i: number) => {
            if (i > 0) {
              const match = text.match(regex);
              if (match) {
                newSegments.push({
                  text: match[0],
                  key: key++,
                  highlight: true,
                  color,
                });
              }
            }
            newSegments.push({ text: part, key: key++ });
          });
        }
      });

      segments = newSegments;
    });

    return segments;
  };

  const segments = highlightText(text);

  return (
    <p>
      {segments.map(({ text, key, highlight, color }) =>
        highlight ? (
          <span key={key} style={{ backgroundColor: color }}>
            {text}
          </span>
        ) : (
          <span key={key}>{text}</span>
        )
      )}
    </p>
  );
};

// const App = () => {
//   const regexList = [
//     { regex: /hello/gi, color: "red" },
//     { regex: /world/gi, color: "blue" },
//     { regex: /101/gi, color: "green" },
//   ];

//   return (
//     <div>
//       <HighlightText
//         text="Hello world! This is a regex 101 demo with Hello and World!"
//         regexList={regexList}
//       />
//     </div>
//   );
// };

export default HighlightText;
