
Base64 Decoder — Chrome Extension
=================================

Quickly decode Base64-encoded text from webpages or via the popup UI.

What this repository contains
----------------------------
A small Chrome extension that provides three main ways to decode Base64:

- Auto-decode: a content script (`content.js`) scans page text nodes and replaces Base64-looking tokens with decoded text (or links if the decoded text is a URL).
- Context menu: a right-click "Decode Base64" item (registered by `background.js`) decodes the selected text and opens a new tab with the decoded result and copy/download buttons.
- Popup UI: `popup.html` + `popup.js` expose a small UI to paste Base64, decode it to UTF-8 or binary hex, copy to clipboard, or download.

Files
-----
- `manifest.json` — Chrome Extension manifest (Manifest V3). Declares permissions, content scripts, icons, and the service worker.
- `content.js` — Content script that walks DOM text nodes, heuristically finds Base64-like tokens, decodes them (if valid), and replaces them inline. Converts decoded URLs to clickable links.
- `background.js` — Service worker that creates the context menu and handles decoding of selected text, opening a new tab with results.
- `popup.html` — Popup UI markup for manual decode operations.
- `popup.js` — Logic for the popup: decode button, paste/copy/download/clear actions, and handling messages (for selections forwarded to popup).
- `styles.css` — Styling for the popup UI.
- `icons/` — Icons used by the extension.

Key features
------------
- Automatically decodes Base64-like tokens you encounter on pages and replaces them inline.
- Right-click a page selection and choose "Decode Base64" to quickly see (and copy/download) decoded content in a new tab.
- Popup provides manual decoding with convenient copy/download options and the ability to export binary as a file.
- If decoded bytes are valid UTF-8, the extension shows text; otherwise it shows hex bytes.

How it works (technical summary)
--------------------------------
- Detection: `content.js` uses a heuristic `isProbablyBase64()` which checks for a Base64 character set and that the token length is divisible by 4. The script also ignores short tokens (the UI requires tokens > 12 characters for auto-replaces).
- Decoding: The code uses `atob()` to convert from Base64 to a binary string, turns that into a `Uint8Array`, then tries `TextDecoder('utf-8')` to detect UTF-8 text. If decoding to UTF-8 fails, bytes are shown as hex.
- URLs: After decoding, if the resulting text looks like a URL, `content.js` creates an `<a>` element so the link is clickable.
- Context menu: `background.js` registers a context menu item and decodes the selection when clicked, opening a `data:text/html` tab showing decoded text or hex, plus copy/download buttons.

Usage
-----
1. Load the extension (developer mode):
   - Open chrome://extensions
   - Enable "Developer mode"
   - Click "Load unpacked" and select this repository's folder

2. Popup UI:
   - Click the extension action (toolbar icon) to open the popup.
   - Paste or type Base64 into the input box.
   - Click "Decode". If decoded bytes form UTF-8 text, that text is shown. Otherwise the hex bytes are shown.
   - Use Copy or Download to export results. Use the file type select to choose `.txt`, `.json`, or `.bin`.

3. Context menu:
   - Select Base64 text on any webpage, right-click, choose "Decode Base64".
   - A new tab opens with the decoded result and buttons to copy or download.

4. Auto-decode on pages:
   - When a page loads, `content.js` scans visible text nodes. Long Base64-like tokens are replaced inline with decoded text. Decoded URLs become clickable links.

Examples
--------
- Input (Base64): `SGVsbG8sIFdvcmxkIQ==`
- Decoded: `Hello, World!`

- Binary (non-UTF8) will be shown as hex bytes like: `ff d8 ff e0 00 10 4a 46 ...` (and can be downloaded as `.bin`).

Permissions & privacy
---------------------
- Permissions in `manifest.json`: `contextMenus`, `clipboardWrite`, `scripting`, `activeTab`.
- Everything runs locally in the browser. No remote servers are contacted by the extension. Opening a decoded result uses a `data:` URL in a new tab.
- Be cautious when decoding untrusted Base64 — decoded content may contain URLs or text you didn't expect. The extension does not execute decoded content; it only displays it. The popup/download functions create blobs or write to the clipboard.

Limitations & edge cases
------------------------
- Heuristic detection may false-positive on non-Base64 tokens that match the character set and length constraints.
- Very large Base64 blobs may impact page performance if auto-decoded. The content script attempts to minimize impact by only decoding reasonably long tokens.
- If `TextDecoder('utf-8')` fails, the extension shows hex bytes — this is intentional to surface non-text binary content.
- The content script avoids modifying `SCRIPT` and `STYLE` nodes but may modify other places where replacing text could affect layout. Use with caution on complex pages.

