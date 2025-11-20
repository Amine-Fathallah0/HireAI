import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { pdfjs } from 'react-pdf';

// Avoid SSR for PDF rendering
const PDFViewer = dynamic(async () => {
  const mod = await import('react-pdf');
  return mod.Document as any;
}, { ssr: false }) as any;

const PageComp = dynamic(async () => {
  const mod = await import('react-pdf');
  return mod.Page as any;
}, { ssr: false }) as any;

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type Props = {
  fileUrl: string | ArrayBuffer | Uint8Array | null;
};

export const ResumePdfViewer: React.FC<Props> = ({ fileUrl }) => {
  if (!fileUrl) return (
    <div className="h-full w-full flex items-center justify-center text-sm text-black/50 border rounded-md">
      PDF preview will appear here
    </div>
  );

  return (
    <div className="w-full h-full overflow-auto border rounded-md">
      <PDFViewer file={fileUrl} loading={<div className="p-4 text-sm">Loading PDF…</div>}>
        <PageComp pageNumber={1} width={600} renderTextLayer={false} renderAnnotationLayer={false} />
      </PDFViewer>
    </div>
  );
};

export default ResumePdfViewer;
