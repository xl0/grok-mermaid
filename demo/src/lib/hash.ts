/**
 * The diagram source as URL-safe text: deflate-raw, then base64url — plain
 * base64 of a large diagram exceeds shareable URL lengths. Used by the main
 * page's `#<data>` hash and the `/render/<data>` viewer route.
 */

const b64 = (bytes: Uint8Array): string => {
	let bin = '';
	// chunked: spreading a large array into fromCharCode blows the stack
	for (let i = 0; i < bytes.length; i += 0x8000)
		bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};
const unB64 = (h: string): Uint8Array =>
	Uint8Array.from(atob(h.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));

export async function packHash(s: string): Promise<string> {
	const stream = new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'));
	return b64(new Uint8Array(await new Response(stream).arrayBuffer()));
}

export async function unpackHash(h: string): Promise<string> {
	// .buffer: TS's BlobPart wants a plain ArrayBuffer, not ArrayBufferLike
	const stream = new Blob([unB64(h).buffer as ArrayBuffer])
		.stream()
		.pipeThrough(new DecompressionStream('deflate-raw'));
	return new Response(stream).text();
}
