// Background service worker: create context menu and decode selection
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "decode-base64",
    title: "Decode Base64",
    contexts: ["selection"]
  });
});

function decodeBase64ToUtf8(b64) {
  try {
    const binary = atob(b64.replace(/\s+/g, ''));
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    try {
      return {text:new TextDecoder('utf-8').decode(bytes), bytes};
    } catch (e) {
      return {text:null, bytes};
    }
  } catch (e) {
    return {error: 'Invalid Base64'};
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "decode-base64" && info.selectionText) {
    const sel = info.selectionText.trim();
    const res = decodeBase64ToUtf8(sel);
    if (res.error) {
      // open a small tab showing error
      chrome.tabs.create({url: 'data:text/html;charset=utf-8,' + encodeURIComponent('<pre>Invalid Base64 selection</pre>')});
      return;
    }
    // Prepare HTML to show result and allow download
    let body;
    if (res.text !== null) {
      body = '<h1>Decoded (UTF-8 text)</h1><pre>' + escapeHtml(res.text) + '</pre>';
    } else {
      const hex = Array.from(res.bytes).map(b => ('0'+b.toString(16)).slice(-2)).join(' ');
      body = '<h1>Decoded (binary)</h1><pre>' + hex + '</pre>';
    }
    body += '<p><button onclick="copy()">Copy to clipboard</button> <button onclick="download()">Download</button></p>';
    body += '<script>function copy(){navigator.clipboard.writeText(document.querySelector("pre").innerText);} function download(){const text=document.querySelector("pre").innerText; const b=new Blob([text],{type:"text/plain;charset=utf-8"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="decoded.txt"; a.click(); URL.revokeObjectURL(u);} function escapeHtml(s){return s;}</script>';
    chrome.tabs.create({url: 'data:text/html;charset=utf-8,' + encodeURIComponent(body)});
  }
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
