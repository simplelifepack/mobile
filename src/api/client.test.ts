import { request } from './client';

afterEach(() => jest.restoreAllMocks());

it('sends concurrent mutations independently, even on the same endpoint', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (_url, init) => ({
    ok: true,
    status: 200,
    json: async () => JSON.parse(String(init?.body)),
  } as Response));
  const [first, second] = await Promise.all([
    request('/documents', { method: 'POST', body: { id: 'one' } }),
    request('/documents', { method: 'POST', body: { id: 'two' } }),
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(first).toEqual({ id: 'one' });
  expect(second).toEqual({ id: 'two' });
});

it('still shares identical concurrent GET requests', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => ({ value: 1 }),
  } as Response);
  await Promise.all([request('/documents'), request('/documents')]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('still shares identical concurrent mutation requests', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => ({ value: 1 }),
  } as Response);
  await Promise.all([
    request('/documents', { method: 'POST', body: { id: 'one' } }),
    request('/documents', { method: 'POST', body: { id: 'one' } }),
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
