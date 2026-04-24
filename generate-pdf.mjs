import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the markdown
const mdPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa63145-1ea0-4e94-8a3e-7af1b8bf7780\\purpledger_product_document.md';
const mdContent = readFileSync(mdPath, 'utf8');

// Convert markdown to a styled HTML document
function mdToHtml(md) {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^```[\w]*\n([\s\S]*?)```$/gm, '<pre><code>$1</code></pre>')
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim() !== '');
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>)/gs, (tables) => `<table>${tables}</table>`)
    .replace(/^> \[!(\w+)\]\n> (.+)$/gm, '<div class="alert alert-$1"><strong>$1:</strong> $2</div>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hptulocdr]|<\/[hptulocdr])(.+)$/gm, '<p>$1</p>');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>PurpLedger — Product Document</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; color: #1a1a2e; line-height: 1.7; padding: 40px 60px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 26pt; color: #4C1D95; border-bottom: 3px solid #4C1D95; padding-bottom: 10px; margin: 30px 0 15px; page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { font-size: 16pt; color: #5B21B6; border-left: 4px solid #8B5CF6; padding-left: 10px; margin: 25px 0 12px; }
  h3 { font-size: 13pt; color: #4C1D95; margin: 18px 0 8px; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
  th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
  tr:nth-child(even) { background: #f5f3ff; }
  tr:first-child { background: #4C1D95; color: white; font-weight: bold; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 10pt; color: #7C3AED; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; margin: 12px 0; overflow-x: auto; font-size: 9pt; border-left: 4px solid #4C1D95; }
  pre code { background: none; color: inherit; padding: 0; }
  ul, ol { margin: 8px 0 8px 24px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 2px solid #e5e7eb; margin: 24px 0; }
  strong { color: #3730a3; }
  .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 14px; margin: 12px 0; border-radius: 4px; }
  blockquote { border-left: 4px solid #8B5CF6; padding-left: 12px; color: #4b5563; font-style: italic; margin: 12px 0; }
  .cover { text-align: center; padding: 80px 0; }
  .cover h1 { border: none; font-size: 36pt; page-break-before: avoid; }
  .cover .subtitle { font-size: 14pt; color: #6B7280; margin-top: 12px; }
  .cover .meta { margin-top: 40px; font-size: 11pt; color: #9CA3AF; }
  @media print {
    body { padding: 20px 40px; }
    h1 { page-break-before: always; }
    h1:first-of-type { page-break-before: avoid; }
    pre { page-break-inside: avoid; }
    table { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="cover">
  <div style="display:inline-block;background:#4C1D95;color:white;padding:12px 28px;border-radius:30px;font-size:11pt;font-weight:bold;letter-spacing:2px;margin-bottom:30px;">CONFIDENTIAL — INTERNAL USE ONLY</div>
  <h1 style="font-size:40pt;border:none;">PurpLedger</h1>
  <div class="subtitle">Comprehensive Product Document</div>
  <div class="subtitle" style="color:#8B5CF6;font-weight:bold;">The Smart Ledger for Modern Collections</div>
  <div class="meta">
    <div>Version 1.2 &nbsp;|&nbsp; April 2026</div>
    <div style="margin-top:8px;">Status: Production-Ready (Pre-Launch)</div>
    <div style="margin-top:8px;">Stack: Next.js 16 &nbsp;·&nbsp; Supabase &nbsp;·&nbsp; Paystack &nbsp;·&nbsp; Brevo &nbsp;·&nbsp; Gemini AI</div>
  </div>
</div>

${mdToHtml(mdContent)}

</body>
</html>`;

writeFileSync(join(__dirname, 'PurpLedger_Product_Document.html'), html, 'utf8');
console.log('✅ HTML saved to PurpLedger_Product_Document.html');
console.log('📄 Open this file in Chrome and use File > Print > Save as PDF');
console.log('   Or press Ctrl+P > Change destination to "Save as PDF"');
