import { uploadMultipart } from './upload';
it('reports measured native upload bytes and supports cancellation without retrying', async () => {
  const original = globalThis.XMLHttpRequest;
  let xhr!: {
    upload: { onprogress?: (event: unknown) => void };
    onload?: () => void;
    onabort?: () => void;
    status: number;
    responseText: string;
    abort: jest.Mock;
  };
  const headers: Record<string, string> = {};
  class MockXHR {
    upload = {};
    status = 200;
    responseText = '{"saved":true}';
    withCredentials = false;
    onload?: () => void;
    onabort?: () => void;
    open = jest.fn();
    send = jest.fn();
    setRequestHeader = (key: string, value: string) => {
      headers[key] = value;
    };
    abort = jest.fn(() => this.onabort?.());
    constructor() {
      xhr = this;
    }
  }
  globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;
  try {
    const progress = jest.fn();
    const pending = uploadMultipart(
      'https://example.test/upload',
      { Authorization: 'Bearer test' },
      new FormData(),
      new AbortController().signal,
      progress,
    );
    xhr.upload.onprogress?.({
      loaded: 512,
      total: 1024,
      lengthComputable: true,
    });
    expect(progress).toHaveBeenCalledWith(512, 1024);
    expect(headers['Content-Type']).toBeUndefined();
    xhr.onload?.();
    const result = await pending;
    expect(await result.json()).toEqual({ saved: true });
    const controller = new AbortController();
    const cancelled = uploadMultipart(
      'https://example.test/upload',
      {},
      new FormData(),
      controller.signal,
      progress,
    );
    const rejected = (async () => {
      await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
    })();
    controller.abort();
    await rejected;
    expect(xhr.abort).toHaveBeenCalledTimes(1);
  } finally {
    globalThis.XMLHttpRequest = original;
  }
});
