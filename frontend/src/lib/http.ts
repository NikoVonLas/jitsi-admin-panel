function handleUnauthorized() {
  if (sessionStorage.getItem('oidc_authenticated')) {
    sessionStorage.removeItem('oidc_authenticated');
    location.replace('/oidc/logout');
  }
}

export async function httpGet(url: string) {
  const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' }, mode: 'cors' });
  if (res.status === 401) handleUnauthorized();
  return res;
}

export async function httpPost(url: string, payload: unknown) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    mode: 'cors',
    method: 'post',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) handleUnauthorized();
  return res;
}
