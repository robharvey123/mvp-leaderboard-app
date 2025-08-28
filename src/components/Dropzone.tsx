import { useRef, useState } from "react";

export default function Dropzone({
  accept = "application/pdf",
  onFile,
  label = "Drop a Play-Cricket PDF here, or click to browse",
}: {
  accept?: string;
  onFile: (file: File) => void;
  label?: string;
}) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f && (accept === "*" || f.type === accept || f.name.toLowerCase().endsWith(".pdf"))) onFile(f);
      }}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition
        ${hover ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white/70"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="text-sm text-gray-600">
        <div className="mb-2 text-base font-medium">Upload Scorecard PDF</div>
        {label}
      </div>
    </div>
  );
}
