/* Triggers a real browser download from generated text/HTML content. Used for
   shipping documents and other files the dashboard produces, so the download
   buttons actually hand the user a file instead of just showing a toast. */

export function downloadFile(filename: string, content: string, mime = 'text/plain'): void {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch {
    /* the environment blocked the download — nothing more to do */
  }
}