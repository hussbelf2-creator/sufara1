/* Turns a rendered contract document node into a real, downloadable PDF file
   entirely in the browser — no server involved. We rasterise the print-ready
   DOM (which only uses plain hex colours, so the capture stays faithful) and
   lay the image across as many A4 pages as the document needs. */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/* Renders one or more element nodes to a single PDF and triggers a download.
   Each node starts on a fresh page, so bulk-downloading many contracts keeps
   them separated in one file. Returns false when generation is not possible
   (e.g. a cross-origin image tainted the canvas) so the caller can fall back
   to the print preview. */
export async function downloadNodesAsPdf(nodes: HTMLElement[], filename: string): Promise<boolean> {
  const list = nodes.filter((n): n is HTMLElement => !!n);
  if (!list.length) return false;

  try {
    /* Make sure the web fonts are ready so the Arabic text renders correctly. */
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* font loading is best-effort only */
      }
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let first = true;

    for (const node of list) {
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(node, {
        scale: window.devicePixelRatio > 1 ? 2 : 1.6,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.94);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      if (!first) pdf.addPage();
      first = false;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(filename);
    return true;
  } catch {
    return false;
  }
}

/* Renders the given element to a PDF and triggers a download. Returns false
   when generation is not possible (e.g. a cross-origin image tainted the
   canvas) so the caller can fall back to the print preview. */
export async function downloadNodeAsPdf(node: HTMLElement, filename: string): Promise<boolean> {
  return downloadNodesAsPdf([node], filename);
}