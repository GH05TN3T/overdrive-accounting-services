import { mkdir, writeFile } from 'node:fs/promises'

const slugs = [
  '2025-tax-season-checklist-is-your-business-ready',
  'avoid-these-common-tax-filing-mistakes-and-save-big-this-year',
  'top-tax-deductions-every-small-business-should-know-for-2025',
  'from-payroll-to-taxes-how-we-handle-it-all',
  'big-league-financial-expertise-at-a-fraction-of-the-price',
  'the-benefits-of-an-all-in-one-accounting-service',
  'the-smart-way-to-manage-payroll-taxes-and-bookkeeping',
  'the-hidden-costs-of-in-house-accounting',
  'why-outsourcing-your-accounting-is-like-hiring-a-full-department',
]

function internalLink(path) {
  if (path.includes('/consultation/')) return '/#appointment'
  if (path.includes('/about-us/')) return '/#about'
  if (path.includes('/services/')) return '/#services'
  if (path.includes('/blog/')) return '/resources'
  return '/#appointment'
}

function cleanHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, '')
    .replace(/development@sharpshelldigital\.com/gi, 'Ghostnet')
    .replace(/Sharpshell Digital/gi, 'Ghostnet')
    .replace(/href=["']https:\/\/overdriveaccountingservices\.com([^"']*)["']/gi, (_match, path) => `href="${internalLink(path)}"`)
    .replace(/href=["']http:\/\/overdriveaccountingservices\.com([^"']*)["']/gi, (_match, path) => `href="${internalLink(path)}"`)
}

const posts = {}
for (const slug of slugs) {
  const response = await fetch(`https://overdriveaccountingservices.com/wp-json/wp/v2/posts?slug=${slug}&_fields=title,content,date`)
  if (!response.ok) throw new Error(`Could not fetch ${slug}: ${response.status}`)
  const items = await response.json()
  if (!items[0]) throw new Error(`Post not found: ${slug}`)
  posts[slug] = { title: items[0].title.rendered, date: items[0].date, author: 'Ghostnet', content: cleanHtml(items[0].content.rendered) }
}

await mkdir('src/data', { recursive: true })
await writeFile('src/data/blogContent.json', `${JSON.stringify(posts, null, 2)}\n`)
console.log(`Synced ${Object.keys(posts).length} blog posts into src/data/blogContent.json`)
