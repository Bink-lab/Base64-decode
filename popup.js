function tryDecodeBase64(b64) {
  try {
    const binary = atob(b64.replace(/\s+/g, ''));
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    try {
      const txt = new TextDecoder('utf-8').decode(bytes);
      return {text: txt, bytes};
    } catch (e) {
      return {text: null, bytes};
    }
  } catch (err) {
    throw new Error('Invalid Base64 input');
  }
}

document.getElementById('decode').addEventListener('click', () => {
  const inEl = document.getElementById('input');
  const outEl = document.getElementById('output');
  const msg = document.getElementById('msg');
  msg.textContent = '';
  try {
    const res = tryDecodeBase64(inEl.value.trim());
    if (res.text !== null) {
      outEl.value = res.text;
      msg.textContent = 'Decoded as UTF-8 text. Showing text.';
    } else {
      outEl.value = Array.from(res.bytes).map(b => ('0'+b.toString(16)).slice(-2)).join(' ');
      msg.textContent = 'Decoded binary (not valid UTF-8). Showing hex bytes.';
    }
  } catch (e) {
    outEl.value = '';
    msg.textContent = e.message;
  }
});

document.getElementById('copy').addEventListener('click', async () => {
  const out = document.getElementById('output').value;
  if (!out) return;
  try {
    await navigator.clipboard.writeText(out);
    document.getElementById('msg').textContent = 'Copied to clipboard.';
  } catch (e) {
    document.getElementById('msg').textContent = 'Failed to copy (permission denied).';
  }
});

document.getElementById('download').addEventListener('click', () => {
  const out = document.getElementById('output').value;
  if (!out) return;
  const type = document.getElementById('filetype').value;
  let blob;
  if (type === 'bin') {
    const hexs = out.split(/\s+/).filter(x=>x);
    const arr = new Uint8Array(hexs.map(h=>parseInt(h,16)));
    blob = new Blob([arr], {type:'application/octet-stream'});
  } else {
    blob = new Blob([out], {type:'text/plain;charset=utf-8'});
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'decoded.' + type;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('input').value = '';
  document.getElementById('output').value = '';
  document.getElementById('msg').textContent = '';
});

document.getElementById('paste').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('input').value = text;
    document.getElementById('msg').textContent = 'Pasted from clipboard.';
  } catch (e) {
    document.getElementById('msg').textContent = 'Paste failed (permission?).';
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  if (msg.type === 'selection') {
    document.getElementById('input').value = msg.selection || '';
    document.getElementById('decode').click();
  }
});
