// Minimal, dependency-free Markdown → HTML for the Markdown canvas element.
// The source string is HTML-escaped before any formatting, so raw markup in
// author content is rendered as text (no injection). Supported subset:
//   #..###### headings · **bold** · *italic* / _italic_ · `code`
//   [text](https://url) links · - / * / + bullets · 1. ordered lists
//   > blockquote · --- / *** / ___ horizontal rule · paragraphs

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Inline formatting. Runs on already-escaped text, so `*`, `_`, backticks and
// brackets are still literal and safe to match.
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/(^|\s)_([^_]+)_(?=\s|$)/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
}

export function renderMarkdown(src: string): string {
  const lines = (src ?? '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let list: 'ul' | 'ol' | null = null
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`)
      list = null
    }
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    // Blank line — separates blocks
    if (trimmed === '') {
      closeList()
      i++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList()
      out.push('<hr />')
      i++
      continue
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      closeList()
      const level = heading[1]!.length
      out.push(`<h${level}>${inline(escapeHtml(heading[2]!))}</h${level}>`)
      i++
      continue
    }

    // Blockquote — collect consecutive `>` lines
    if (/^>\s?/.test(trimmed)) {
      closeList()
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test((lines[i] ?? '').trim())) {
        buf.push((lines[i] ?? '').trim().replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${inline(escapeHtml(buf.join(' ')))}</blockquote>`)
      continue
    }

    // Unordered list item
    const ul = /^[-*+]\s+(.*)$/.exec(trimmed)
    if (ul) {
      if (list !== 'ul') {
        closeList()
        out.push('<ul>')
        list = 'ul'
      }
      out.push(`<li>${inline(escapeHtml(ul[1]!))}</li>`)
      i++
      continue
    }

    // Ordered list item
    const ol = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (ol) {
      if (list !== 'ol') {
        closeList()
        out.push('<ol>')
        list = 'ol'
      }
      out.push(`<li>${inline(escapeHtml(ol[1]!))}</li>`)
      i++
      continue
    }

    // Paragraph
    closeList()
    out.push(`<p>${inline(escapeHtml(trimmed))}</p>`)
    i++
  }

  closeList()
  return out.join('')
}
