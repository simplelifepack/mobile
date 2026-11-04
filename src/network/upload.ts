/** RN's XMLHttpRequest exposes native upload byte counts; fetch does not. */
export function uploadMultipart(
  url: string,
  headers: Record<string, string>,
  body: FormData,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number) => void,
) {
  return new Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = () => signal.removeEventListener('abort', abort);
    xhr.open('POST', url);
    xhr.withCredentials = true;
    Object.entries(headers).forEach(([name, value]) =>
      xhr.setRequestHeader(name, value),
    );
    xhr.upload.onprogress = event =>
      onProgress(event.loaded, event.lengthComputable ? event.total : 0);
    xhr.onload = () => {
      finish();
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => JSON.parse(xhr.responseText),
      });
    };
    xhr.onerror = () => {
      finish();
      reject(new TypeError('Network request failed'));
    };
    xhr.onabort = () => {
      finish();
      reject(
        Object.assign(new Error('Upload cancelled.'), { name: 'AbortError' }),
      );
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      finish();
      reject(
        Object.assign(new Error('Upload cancelled.'), { name: 'AbortError' }),
      );
      return;
    }
    xhr.send(body);
  });
}
