function isProbablyBase64(str) {
  return /^[A-Za-z0-9+/=\s]+$/.test(str) && str.length % 4 === 0;
}

function tryDecodeBase64(b64) {
  try {
    const binary = atob(b64.replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    if (/^[\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]*$/.test(text)) {
      return text;
    }
  } catch (e) {}
  return null;
}

function isUrl(text) {
  return /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(text);
}

function walkAndDecode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parts = node.nodeValue.split(/\s+/);
    let changed = false;
    const newNodes = [];

    for (let i = 0; i < parts.length; i++) {
      let p = parts[i];
      if (p.length > 12 && isProbablyBase64(p)) {
        const decoded = tryDecodeBase64(p);
        if (decoded) {
          if (isUrl(decoded)) {
            const a = document.createElement("a");
            a.href = decoded.startsWith("http") ? decoded : "http://" + decoded;
            a.textContent = decoded;
            newNodes.push(a);
          } else {
            newNodes.push(document.createTextNode(decoded));
          }
          changed = true;
          continue;
        }
      }
      newNodes.push(document.createTextNode(p));
    }

    if (changed) {
      const parent = node.parentNode;
      if (!parent) return;
      const spacer = document.createTextNode(" ");
      parent.insertBefore(newNodes[0], node);
      for (let j = 1; j < newNodes.length; j++) {
        parent.insertBefore(spacer.cloneNode(), node);
        parent.insertBefore(newNodes[j], node);
      }
      parent.removeChild(node);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "SCRIPT" && node.tagName !== "STYLE") {
    for (let child of Array.from(node.childNodes)) {
      walkAndDecode(child);
    }
  }
}

walkAndDecode(document.body);

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      walkAndDecode(node);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
