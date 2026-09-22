import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  Minus,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import AdminDashboard from './components/AdminDashboard'
import AppointmentForm from './components/AppointmentForm'
import ClientPortal from './components/ClientPortal'
import './styles.css'
import './portal.css'

const siteLogo = 'https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png'
const assetRoot = 'https://overdriveaccountingservices.com/wp-content/uploads/'

const services = [
  {
    number: '01',
    title: 'Accounting & bookkeeping',
    description: 'Clean, current numbers that show you exactly where your business stands.',
    image: `${assetRoot}2024/06/Accounting.jpg`,
  },
  {
    number: '02',
    title: 'Tax preparation & filing',
    description: 'Proactive tax strategy and accurate filing without the last-minute scramble.',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
  },
  {
    number: '03',
    title: 'Payroll management',
    description: 'Reliable, compliant payroll that lets you take care of your people with confidence.',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
  },
  {
    number: '04',
    title: 'Fractional CFO',
    description: 'The financial leadership and forward-looking perspective your next stage deserves.',
    image: `${assetRoot}2026/05/3501.jpg`,
  },
  {
    number: '05',
    title: 'Small business lending',
    description: 'Funding preparation that helps lenders see the strength and story behind your numbers.',
    image: `${assetRoot}2024/06/LoanApplication.jpg`,
  },
  {
    number: '06',
    title: 'Benefits administration',
    description: 'Organized benefits support that helps your team and your business stay competitive.',
    image: `${assetRoot}2026/05/953.jpg`,
  },
  {
    number: '07',
    title: 'Business insurance management',
    description: 'Practical coverage coordination that keeps risk visible as your company grows.',
    image: `${assetRoot}2026/05/3822.jpg`,
  },
  {
    number: '08',
    title: 'Human resources',
    description: 'People operations guidance that brings structure to the moments that matter.',
    image: `${assetRoot}2026/05/4691.jpg`,
  },
]

const testimonials = [
  {
    quote: 'The confidence I have in knowing my ducks are in a row with Overdrive in charge allows me to focus on the mission of my company.',
    name: 'Kelly N. Mawhinney',
    role: 'Business owner',
    initials: 'KM',
  },
  {
    quote: 'They are professional, get back to your inquiries in a timely manner, and suggest solutions that benefit your business.',
    name: 'Marilyn Anglade',
    role: 'Overdrive client',
    initials: 'MA',
  },
  {
    quote: 'Alex and his team work incredibly fast. Their response time for any questions I had was second to none.',
    name: 'Alyx Cassel',
    role: 'Business owner',
    initials: 'AC',
  },
]

const partnerLogos = [
  { name: 'SharpShell Digital', image: `${assetRoot}2024/06/Logo_Sharpshell.jpg` },
  { name: 'Coach Kelly', image: `${assetRoot}2024/06/Logo_CoachKelly.jpg` },
  { name: 'BlueLine', image: `${assetRoot}2024/06/Logo_BlueLine.jpg` },
  { name: 'Prince Legal', image: `${assetRoot}2024/06/Logo_PrinceLegal.jpg` },
  { name: 'Palm Home', image: `${assetRoot}2024/06/Logo_PalmHome.jpg` },
  { name: 'Alyx Cassel', image: `${assetRoot}2024/06/Logo_Alyx.jpg` },
  { name: 'Hyped Goods', image: `${assetRoot}2024/06/Logo_HypedGoods.jpg` },
  { name: 'Killer Coffee', image: `${assetRoot}2024/06/Logo_KillerCoffee.jpg` },
  { name: 'Tail Feather', image: `${assetRoot}2026/05/TAIL-FEATHER-LOGO-1-1-300x300.png` },
  { name: 'Black and Red', image: `${assetRoot}2026/05/black-and-red-245x300.jpg` },
  { name: 'Insight', image: `${assetRoot}2026/06/Insight-logo-289x300.png` },
  { name: 'Gotcha', image: `${assetRoot}2026/09/gotcha1.jpg` },
  { name: 'New Project', image: `${assetRoot}2026/09/New-Project.jpg` },
]

const insights = [
  {
    category: 'Tax strategy',
    date: 'April 22, 2025',
    readTime: '5 min read',
    title: '2025 Tax Season Checklist: Is Your Business Ready?',
    summary: 'A practical checklist to help business owners prepare for tax season and keep financial operations on track.',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/2025-tax-season-checklist-is-your-business-ready/',
  },
  {
    category: 'Tax strategy',
    date: 'March 10, 2025',
    readTime: '5 min read',
    title: 'Avoid These Common Tax Filing Mistakes and Save Big This Year',
    summary: 'The filing mistakes business owners should watch for before submitting their returns.',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/avoid-these-common-tax-filing-mistakes-and-save-big-this-year/',
  },
  {
    category: 'Business growth',
    date: 'February 10, 2025',
    readTime: '5 min read',
    title: 'Top Tax Deductions Every Small Business Should Know for 2025',
    summary: 'A helpful look at deductions small business owners should discuss with their accounting partner.',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/top-tax-deductions-every-small-business-should-know-for-2025/',
  },
  {
    category: 'Payroll & HR',
    date: 'January 13, 2025',
    readTime: '4 min read',
    title: 'From Payroll to Taxes: How We Handle It All',
    summary: 'How Overdrive helps businesses coordinate payroll, tax preparation, and financial operations.',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/from-payroll-to-taxes-how-we-handle-it-all/',
  },
  {
    category: 'Tax & IRS',
    date: 'September 4, 2026',
    readTime: '4 min read',
    title: '2026 payroll update: the Social Security wage base is $184,500',
    summary: 'A practical review of the 2026 wage base, withholding responsibilities, and the payroll records employers should keep current.',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
    source: 'IRS Publication 15',
    sourceUrl: 'https://www.irs.gov/publications/p15',
  },
  {
    category: 'Payroll & HR',
    date: 'September 4, 2026',
    readTime: '5 min read',
    title: 'The employer checklist behind every accurate paycheck',
    summary: 'The IRS reminder for National Payroll Week covers withholding, electronic deposits, filing, recordkeeping, and protecting payroll data.',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'IRS newsroom',
    sourceUrl: 'https://www.irs.gov/newsroom/irs-reminder-national-payroll-week-is-time-for-a-paycheck-checkup',
  },
  {
    category: 'Tax & IRS',
    date: 'March 2026',
    readTime: '6 min read',
    title: 'Form 941 in 2026: what employers need to review now',
    summary: 'The March 2026 revision includes updated employment tax guidance, electronic refund payments, and the current filing reminders.',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
    source: 'IRS Form 941 instructions',
    sourceUrl: 'https://www.irs.gov/instructions/i941',
  },
  {
    category: 'Tax law',
    date: '2026 update',
    readTime: '5 min read',
    title: 'The $2,000 information reporting threshold: what changes for 2026',
    summary: 'The IRS explains the updated threshold for certain 1099 and wage reporting situations after calendar year 2025.',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
    source: 'IRS Publication 15',
    sourceUrl: 'https://www.irs.gov/publications/p15',
  },
  {
    category: 'Payroll & HR',
    date: '2026 update',
    readTime: '5 min read',
    title: 'Qualified overtime compensation: the payroll workflow employers should revisit',
    summary: 'A plain-English starting point for reviewing updated W-4 workflows and withholding procedures for qualified overtime.',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
    source: 'IRS Form 941 instructions',
    sourceUrl: 'https://www.irs.gov/instructions/i941',
  },
  {
    category: 'Accounting',
    date: 'Overdrive guide',
    readTime: '4 min read',
    title: 'The monthly close: a simple rhythm for better business decisions',
    summary: 'Why clean books, reconciled accounts, and a short monthly review help owners make decisions before the next deadline arrives.',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: '#appointment',
  },
]

function MarketingSite() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [testimonial, setTestimonial] = useState(0)
  const [insightCategory, setInsightCategory] = useState('All updates')

  useEffect(() => {
    const rotation = setInterval(() => {
      setTestimonial((current) => (current + 1) % testimonials.length)
    }, 6500)

    return () => clearInterval(rotation)
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const visibleInsights = insightCategory === 'All updates' ? insights : insights.filter((post) => post.category === insightCategory)

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" onClick={closeMenu} aria-label="Overdrive Accounting Services home">
          <img src={siteLogo} alt="Overdrive Accounting Services" />
        </a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <a className="nav-link" href="#services" onClick={closeMenu}>Services</a>
          <a className="nav-link" href="#approach" onClick={closeMenu}>Our approach</a>
          <a className="nav-link" href="#about" onClick={closeMenu}>About us</a>
          <a className="nav-link" href="#insights" onClick={closeMenu}>Insights</a>
          <a className="nav-link nav-portal" href="/portal" onClick={closeMenu}><span className="nav-portal-pulse" /> Client portal <ArrowUpRight size={14} /></a>
          <a className="nav-phone" href="tel:352-749-2459" onClick={closeMenu}><Phone size={15} /> (352) 749-2459</a>
           <a className="button button-small" href="#appointment" onClick={closeMenu}>Let's talk <ArrowUpRight size={16} /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-gridlines" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> Overdrive Accounting Services</div>
            <h1>Push your business into <em>overdrive.</em></h1>
            <p className="hero-lede">At Overdrive Accounting Services, we champion real results for real achievers. Our holistic approach goes beyond mere number-crunching, aiming to amplify the aspirations of business owners everywhere.</p>
            <div className="hero-actions">
              <a className="button button-accent" href="#appointment">Schedule a free consultation <ArrowUpRight size={18} /></a>
              <a className="text-link text-link-light" href="#approach"><span className="play-icon"><Play size={11} fill="currentColor" /></span> See how we work</a>
            </div>
            <div className="hero-assurance"><ShieldCheck size={17} /> The accounting partner you deserve</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-wrap">
              <img src={`${assetRoot}2024/06/AboutUS.jpg`} alt="Overdrive team meeting with a business owner" />
              <div className="photo-label"><span>01</span><span className="label-line" /><span>Overdrive Accounting Services</span></div>
            </div>
            <div className="hero-stat-card"><span className="stat-kicker">Your business, supported</span><strong>15<span>+</span></strong><span>years of strategic experience</span></div>
            <div className="hero-orbit" aria-hidden="true"><span>O</span></div>
          </div>
          <div className="hero-scroll"><span>Scroll to explore</span><span className="scroll-line" /></div>
        </section>

        <section className="marquee" aria-label="Our capabilities">
          <div className="marquee-track"><span>ACCOUNTING</span><Minus /><span>STRATEGY</span><Minus /><span>GROWTH</span><Minus /><span>ACCOUNTING</span><Minus /><span>STRATEGY</span><Minus /><span>GROWTH</span></div>
        </section>

        <section className="intro section-pad" id="about">
           <div className="section-kicker">The accounting partner you deserve <span /></div>
          <div className="intro-layout">
            <h2>The accounting partner <span>you deserve.</span></h2>
            <div className="intro-body">
              <p>At Overdrive Accounting Services, we champion real results for real achievers.</p>
              <p>As you navigate the evolving landscape of business, let our team be your guiding star, bringing experience, strategy, and unparalleled expertise to your journey.</p>
              <a className="text-link" href="#contact">Get to know Overdrive <ArrowUpRight size={17} /></a>
            </div>
          </div>
        </section>

        <section className="services-section section-pad" id="services">
          <div className="section-heading-row">
            <div><div className="section-kicker">Services we offer <span /></div><h2>Your premier partner for <span>comprehensive financial solutions.</span></h2></div>
            <p>Explore our comprehensive suite of financial services designed to drive your business’s success.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <a className="service-card" href="#contact" key={service.number}>
                <div className="service-image"><img src={service.image} alt="" /><span className="service-number">{service.number}</span><span className="service-arrow"><ArrowUpRight size={19} /></span></div>
                <div className="service-content"><h3>{service.title}</h3>{service.description && <p>{service.description}</p>}<span className="learn-more">Explore service <ArrowUpRight size={15} /></span></div>
              </a>
            ))}
          </div>
          <a className="button button-outline" href="#contact">View all services <ArrowUpRight size={17} /></a>
        </section>

        <section className="partners-section section-pad" aria-labelledby="partners-title">
          <div className="partners-intro"><div><div className="section-kicker">Highlighted partners <span /></div><h2 id="partners-title">Highlighted <span>partners.</span></h2></div><p>Our clients and partners are an important part of the Overdrive Accounting Services community.</p></div>
          <div className="partner-marquee" aria-label="Overdrive clients and partners"><div className="partner-track">{[...partnerLogos, ...partnerLogos].map((partner, index) => <div className="partner-logo" key={`${partner.name}-${index}`} aria-hidden={index >= partnerLogos.length}><img src={partner.image} alt={index >= partnerLogos.length ? '' : partner.name} loading="lazy" /></div>)}</div></div>
        </section>

        <section className="approach section-pad" id="approach">
          <div className="approach-image"><img src={`${assetRoot}2024/06/LoanApplication.jpg`} alt="Business owner reviewing a financial plan" /><div className="image-stamp"><Sparkles size={17} /><span>Strategy<br />in motion</span></div></div>
          <div className="approach-copy"><div className="section-kicker">Overdrive Accounting Services <span /></div><h2>Comprehensive <span>financial services.</span></h2><p className="large-copy">Overdrive Accounting Services provides a comprehensive suite of financial services designed to drive your business’s success. From meticulous accounting and bookkeeping to expert payroll management, business advising, business plan creation, and small business funding application assistance, our team is dedicated to delivering professional and personalized solutions.</p>
             <a className="text-link" href="#appointment">Schedule a free consultation <ArrowUpRight size={17} /></a>
          </div>
        </section>

        <section className="testimonial-section section-pad">
           <div className="testimonial-top"><div><div className="section-kicker">Our clients say it best <span /></div><h2>Our clients say <span>it best.</span></h2></div><div className="slider-controls"><button onClick={() => setTestimonial((testimonial - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial">←</button><span>0{testimonial + 1} <i>/</i> 0{testimonials.length}</span><button onClick={() => setTestimonial((testimonial + 1) % testimonials.length)} aria-label="Next testimonial">→</button></div></div>
          <div className="testimonial-viewport" aria-live="polite"><div className="testimonial-track" style={{ transform: `translateX(-${testimonial * 100}%)` }}>{testimonials.map((review) => <div className="testimonial-card" key={review.name}><div className="quote-mark">“</div><blockquote>{review.quote}</blockquote><div className="testimonial-author"><span className="avatar">{review.initials}</span><span><strong>{review.name}</strong><small>{review.role}</small></span></div><div className="google-note"><span className="google-g">G</span> Verified Google review</div></div>)}</div></div>
        </section>

          <section className="insights section-pad" id="insights">
           <div className="section-heading-row"><div><div className="section-kicker">Recent blog posts <span /></div><h2>Overdrive Accounting Services <span>blog.</span></h2></div><a className="text-link" href="https://www.irs.gov/newsroom" target="_blank" rel="noreferrer">Follow IRS updates <ArrowUpRight size={17} /></a></div>
           <div className="insight-filters" aria-label="Filter insights">{['All updates', 'Tax & IRS', 'Tax law', 'Accounting', 'Payroll & HR'].map((category) => <button className={insightCategory === category ? 'active' : ''} key={category} onClick={() => setInsightCategory(category)}>{category}</button>)}</div>
           <div className="insights-grid"><article className="featured-insight"><div className="insight-image"><img src={visibleInsights[0].image} alt="" /><span>{visibleInsights[0].category}</span></div><div className="insight-meta">{visibleInsights[0].date} <span>•</span> {visibleInsights[0].readTime}</div><h3>{visibleInsights[0].title}</h3><p className="insight-summary">{visibleInsights[0].summary}</p><a className="text-link" href={visibleInsights[0].sourceUrl} target={visibleInsights[0].sourceUrl.startsWith('http') ? '_blank' : undefined} rel={visibleInsights[0].sourceUrl.startsWith('http') ? 'noreferrer' : undefined}>{visibleInsights[0].sourceUrl === '#appointment' ? 'Start a conversation' : visibleInsights[0].source === 'Overdrive Accounting Services' ? 'Read article' : `Read source: ${visibleInsights[0].source}`} <ArrowUpRight size={16} /></a></article><div className="insight-list">{visibleInsights.slice(1, 4).map((post, index) => <article key={post.title}><span className="insight-index">0{index + 1}</span><div><div className="insight-meta">{post.date} <span>•</span> {post.category}</div><h3>{post.title}</h3><p>{post.summary}</p><a href={post.sourceUrl} target={post.sourceUrl.startsWith('http') ? '_blank' : undefined} rel={post.sourceUrl.startsWith('http') ? 'noreferrer' : undefined}>Read article <ArrowUpRight size={15} /></a></div></article>)}</div></div>
          </section>

         <section className="appointment-section section-pad" id="appointment"><div className="appointment-layout"><div className="appointment-copy"><div className="section-kicker">Start with a conversation <span /></div><h2>Let’s find the <span>right next step.</span></h2><p>Tell us a little about your business and choose a preferred date. Our team will follow up to confirm the conversation.</p><div className="appointment-details"><span>01</span><p>Submit your request</p><span>02</span><p>We confirm the time</p><span>03</span><p>We get to work</p></div></div><div className="appointment-card"><div className="appointment-card-top"><span>Free consultation</span><small>Usually 30 minutes</small></div><AppointmentForm /></div></div></section>

         <section className="contact-section" id="contact"><div className="contact-bg-word">OVERDRIVE</div><div className="contact-inner"><div className="section-kicker eyebrow-light">Ready to get started <span /></div><h2>Ready to push your business into <em>overdrive?</em></h2><p>Schedule a free consultation and discover how Overdrive Accounting Services can elevate your business to new heights.</p><a className="button button-accent" href="#appointment">Schedule a free consultation <ArrowUpRight size={18} /></a></div><div className="contact-curve" /></section>
      </main>

      <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><img src={siteLogo} alt="Overdrive Accounting Services" /><p>Strategic accounting and business support for owners ready to move forward.</p><a className="footer-email" href="mailto:Info@OverdriveAccountingServices.com">Info@OverdriveAccountingServices.com <ArrowUpRight size={15} /></a></div><div className="footer-links"><div><span>Explore</span><a href="#about">About us</a><a href="#services">Services</a><a href="#insights">Insights</a></div><div><span>Connect</span><a href="tel:352-749-2459">(352) 749-2459</a><a href="#appointment">Free consultation</a><a href="/portal">Client portal</a></div><div><span>Visit</span><a href="https://maps.google.com/?q=9100+Conroy+Windermere+Road+Windermere+FL+34786">9100 Conroy Windermere Road<br />Suite 200<br />Windermere, FL 34786</a></div></div></div><div className="footer-bottom"><span>© 2024 Overdrive Accounting Services, LLC</span></div></footer>
    </div>
  )
}

function App() {
  const route = window.location.pathname.replace(/\/+$/, '') || '/'
  if (route === '/admin') return <AdminDashboard />
  if (route === '/portal') return <ClientPortal />
  return <MarketingSite />
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
