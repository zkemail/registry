import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const p: string | undefined = body?.p;
    if (!p) {
      return Response.json({ error: 'Missing p field' }, { status: 400 });
    }
    const base64 = p.startsWith('p=') ? p.slice('p='.length) : p;
    const pem = `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
    const key = crypto.createPublicKey(pem);
    const bits = key.asymmetricKeyDetails?.modulusLength;
    return Response.json({ bits });
  } catch (err: any) {
    return Response.json({ error: err?.message || 'Failed to parse key' }, { status: 400 });
  }
}


