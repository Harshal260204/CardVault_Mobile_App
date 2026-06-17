import type { AxiosInstance } from 'axios';

export async function downloadBlob(
  client: AxiosInstance,
  path: string,
  filename: string,
): Promise<void> {
  const response = await client.get(path, { responseType: 'blob' });
  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
