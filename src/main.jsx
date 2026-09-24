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
import './styles.css'
import './portal.css'

const siteLogo = 'https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png'
const clientPortalUrl = 'https://overdriveaccountingservices.securefilepro.com/portal/#/login'
const assetRoot = 'https://overdriveaccountingservices.com/wp-content/uploads/'

const services = [
  {
    number: '01',
    title: 'Accounting & bookkeeping',
    description: '',
    image: `${assetRoot}2024/06/Accounting.jpg`,
  },
  {
    number: '02',
    title: 'Tax preparation & filing',
    description: '',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
  },
  {
    number: '03',
    title: 'Payroll management',
    description: '',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
  },
  {
    number: '04',
    title: 'Fractional CFO',
    description: '',
    image: `${assetRoot}2026/05/3501.jpg`,
  },
  {
    number: '05',
    title: 'Small business lending',
    description: '',
    image: `${assetRoot}2024/06/LoanApplication.jpg`,
  },
  {
    number: '06',
    title: 'Benefits administration',
    description: '',
    image: `${assetRoot}2026/05/953.jpg`,
  },
  {
    number: '07',
    title: 'Business insurance management',
    description: '',
    image: `${assetRoot}2026/05/3822.jpg`,
  },
  {
    number: '08',
    title: 'Human resources',
    description: '',
    image: `${assetRoot}2026/05/4691.jpg`,
  },
]

const leadership = [
  {
    name: 'Alex Hodo, MBA',
    role: 'CEO of Overdrive Accounting',
    bio: 'Specializing in accounting and fractional CFO services for businesses. 15 years of experience providing strategic financial leadership, forecasting, cash-flow management, and business advisory services. Trusted advisor to business owners and leadership teams, focused on informed decision-making and sustainable growth. Serves on nearly 20 boards, with extensive experience in financial oversight, governance, and strategic planning.',
    image: `${assetRoot}2024/06/AlexHodo.jpg`,
  },
  {
    name: 'Wanda Nagovich, EA',
    role: 'Senior Managing Accountant',
    bio: '25 years of experience in accounting, tax, payroll, consulting, and business advisory services. Nearly 20 years of controller experience, overseeing financial teams and managing financial reporting, reconciliations, budgeting, cash flow, and day-to-day accounting operations. Enrolled Agent authorized to represent businesses before the IRS and state tax authorities, with expertise in tax matters, compliance, and representation.',
    image: `${assetRoot}2024/06/Wanda2.jpg`,
  },
  {
    name: 'Karla Gonzalez',
    role: 'Senior Bookkeeper',
    bio: 'Award-winning bookkeeper with 20+ years of experience managing financial records and accounting processes. Skilled in accounts payable, accounts receivable, reconciliations, payroll, and financial reporting. Known for accuracy, organization, confidentiality, and strong attention to detail. Dependable professional committed to maintaining accurate records and supporting smooth day-to-day financial operations.',
    image: `${assetRoot}2026/09/Karla-Gonzalez-1.png`,
  },
  {
    name: 'Shaun Hodo',
    role: 'In House Counsel',
    bio: 'In-house counsel with nearly 10 years of experience advising a small business accounting firm. Well-versed in business law, including contracts, insurance, employment, and workers’ compensation. Experienced in contract review, legal risk management, negotiation, and general business matters. Provides strategic, practical legal guidance to protect the firm and support its continued growth.',
    image: `${assetRoot}2026/09/Shaun-Hodo-1.jpg`,
  },
]

const testimonials = [
  {
    quote: 'The confidence I have in knowing my ducks are in a row with Overdrive in charge allows me to focus on the mission of my company.',
    name: 'Kelly N. Mawhinney',
    role: '',
    initials: 'KM',
  },
  {
    quote: 'They are professional, get back to your inquiries in a timely manner, and suggest solutions that benefit your business.',
    name: 'Marilyn Anglade',
    role: '',
    initials: 'MA',
  },
  {
    quote: 'Alex and his team work incredibly fast. Their response time for any questions I had was second to none.',
    name: 'Alyx Cassel',
    role: '',
    initials: 'AC',
  },
  {
    quote: 'Business solutions tax preparation has qualified professionals. They always get back within 24 hours. The company is diversified and does more than just taxes; they do all small or large business needs.',
    name: 'Sullivan Plumbing LLC',
    role: '',
    initials: 'SP',
  },
  {
    quote: 'Alex and his team are amazing!! I would absolutely recommend Overdrive Accounting Services for all your accounting needs without a doubt.',
    name: 'Tammy Sims',
    role: '',
    initials: 'TS',
  },
  {
    quote: 'We cannot say enough good things about Overdrive Accounting Services. They handle our business taxes as well as our personal taxes and they truly do it all. They have become integral to our growth and feel more like trusted advisors than just accountants.',
    name: 'Jesenia Gonzalez',
    role: '',
    initials: 'JG',
  },
  {
    quote: 'It has been a delight and a stress reliever to work with Alex and his team. Everyone is quite interpersonal and always goes above and beyond what is expected. I appreciate the passion and dedication for their work, and their ability to treat me as more than just a client.',
    name: 'Prince Legal',
    role: '',
    initials: 'PL',
  },
  {
    quote: 'I’ve had the pleasure of working with Alex and the Overdrive Team. They have a natural ability to connect with people and are incredibly helpful. The professionals at Overdrive Accounting Services are solutions-oriented and their expertise truly stands out.',
    name: 'V. Cobo',
    role: '',
    initials: 'VC',
  },
  {
    quote: 'Overdrive Accounting Services has done a fantastic job of helping me to legally minimize my tax liability, saving me tens of thousands of dollars. Alex is a joy to work with and working with Wanda leaves you knowing you are in good hands.',
    name: 'Jason Baruch',
    role: '',
    initials: 'JB',
  },
  {
    quote: 'Outstanding service - responsive and detailed! Alex and his team at Overdrive are exceptional. They are incredibly responsive, highly detailed in their work, and always willing to go above and beyond to support our business.',
    name: 'Allure Exhibits',
    role: '',
    initials: 'AE',
  },
  {
    quote: 'I own a small law firm and have been without an accountant for too long. Overdrive Accounting was recommended to me and I could not be happier. Every decision has been explained to me in detail and they are extremely responsive to any inquiries.',
    name: 'Roseanne Eckert',
    role: '',
    initials: 'RE',
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
    readTime: '',
    title: '2025 Tax Season Checklist: Is Your Business Ready?',
    summary: '',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/2025-tax-season-checklist-is-your-business-ready/',
  },
  {
    category: 'Tax strategy',
    date: 'March 10, 2025',
    readTime: '',
    title: 'Avoid These Common Tax Filing Mistakes and Save Big This Year',
    summary: '',
    image: `${assetRoot}2024/06/Taxes2.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/avoid-these-common-tax-filing-mistakes-and-save-big-this-year/',
  },
  {
    category: 'Business growth',
    date: 'February 10, 2025',
    readTime: '',
    title: 'Top Tax Deductions Every Small Business Should Know for 2025',
    summary: '',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/top-tax-deductions-every-small-business-should-know-for-2025/',
  },
  {
    category: 'Payroll & HR',
    date: 'January 13, 2025',
    readTime: '',
    title: 'From Payroll to Taxes: How We Handle It All',
    summary: '',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/from-payroll-to-taxes-how-we-handle-it-all/',
  },
  {
    category: 'Business growth',
    date: 'December 9, 2024',
    readTime: '',
    title: 'Big-League Financial Expertise at a Fraction of the Price',
    summary: '',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/big-league-financial-expertise-at-a-fraction-of-the-price/',
  },
  {
    category: 'Accounting',
    date: 'November 11, 2024',
    readTime: '',
    title: 'The Benefits of an All-In-One Accounting Service',
    summary: '',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/the-benefits-of-an-all-in-one-accounting-service/',
  },
  {
    category: 'Payroll & HR',
    date: 'October 11, 2024',
    readTime: '',
    title: 'The Smart Way to Manage Payroll, Taxes, and Bookkeeping',
    summary: '',
    image: `${assetRoot}2024/06/PayrollManagement.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/the-smart-way-to-manage-payroll-taxes-and-bookkeeping/',
  },
  {
    category: 'Accounting',
    date: 'September 4, 2024',
    readTime: '',
    title: 'The Hidden Costs of In-House Accounting',
    summary: '',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/the-hidden-costs-of-in-house-accounting/',
  },
  {
    category: 'Accounting',
    date: 'August 15, 2024',
    readTime: '',
    title: 'Why Outsourcing Your Accounting Is Like Hiring A Full Department',
    summary: '',
    image: `${assetRoot}2024/06/Accounting.jpg`,
    source: 'Overdrive Accounting Services',
    sourceUrl: 'https://overdriveaccountingservices.com/why-outsourcing-your-accounting-is-like-hiring-a-full-department/',
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
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [blogLoading, setBlogLoading] = useState(false)
  const [blogError, setBlogError] = useState('')

  useEffect(() => {
    const rotation = setInterval(() => {
      setTestimonial((current) => (current + 1) % testimonials.length)
    }, 6500)

    return () => clearInterval(rotation)
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const visibleInsights = insightCategory === 'All updates' ? insights : insights.filter((post) => post.category === insightCategory)
  const openBlog = async (post) => {
    const slug = post.sourceUrl.split('/').filter(Boolean).pop()
    setBlogLoading(true)
    setBlogError('')
    try {
      const response = await fetch(`/api/blog/${slug}`)
      if (!response.ok) throw new Error('This article is unavailable right now.')
      setSelectedBlog(await response.json())
    } catch (error) { setBlogError(error.message) }
    setBlogLoading(false)
  }

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
          <a className="nav-link" href="#insights" onClick={closeMenu}>Resources</a>
          <a className="nav-link" href="#about" onClick={closeMenu}>About us</a>
          <a className="nav-link" href="#insights" onClick={closeMenu}>Insights</a>
          <a className="nav-link nav-portal" href={clientPortalUrl} onClick={closeMenu}><span className="nav-portal-pulse" /> Client portal <ArrowUpRight size={14} /></a>
          <a className="nav-phone" href="tel:352-749-2459" onClick={closeMenu}><Phone size={15} /> (352) 749-2459</a>
           <a className="button button-small" href="#appointment" onClick={closeMenu}>Free consultation <ArrowUpRight size={16} /></a>
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
            </div>
            <div className="hero-assurance"><ShieldCheck size={17} /> The accounting partner you deserve</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-wrap">
              <img src={`${assetRoot}2024/06/AboutUS.jpg`} alt="Overdrive team meeting with a business owner" />
              <div className="photo-label"><span>01</span><span className="label-line" /><span>Overdrive Accounting Services</span></div>
            </div>
          </div>
        </section>

        <section className="marquee" aria-label="Our capabilities">
           <div className="marquee-track"><div className="marquee-group"><span>ACCOUNTING</span><Minus /><span>STRATEGY</span><Minus /><span>GROWTH</span></div><div className="marquee-group" aria-hidden="true"><span>ACCOUNTING</span><Minus /><span>STRATEGY</span><Minus /><span>GROWTH</span></div></div>
        </section>

        <section className="intro section-pad" id="about">
           <div className="section-kicker">The accounting partner you deserve <span /></div>
          <div className="intro-layout">
            <h2>The accounting partner <span>you deserve.</span></h2>
            <div className="intro-body">
              <p>Overdrive Accounting Services provides a comprehensive suite of financial services designed to drive your business’s success.</p>
              <p>From meticulous accounting and bookkeeping to expert payroll management, business advising, business plan creation, and small business funding application assistance, our team is dedicated to delivering professional and personalized solutions. We understand the challenges you face and are here to ensure your financial operations are seamless and your strategic decisions are informed. Let us help you navigate the complexities of financial management with precision and expertise. Contact us today to discover how Overdrive Accounting Services can elevate your business to new heights!</p>
              <a className="text-link" href="#contact">Get to know Overdrive <ArrowUpRight size={17} /></a>
            </div>
          </div>
        </section>

        <section className="leadership-section section-pad" aria-labelledby="leadership-title"><div className="section-kicker">Meet our leadership <span /></div><h2 id="leadership-title">The professionals behind <span>Overdrive.</span></h2><div className="leadership-grid">{leadership.map((person) => <article className="leader-card" key={person.name}><div className="leader-image"><img src={person.image} alt={person.name} /></div><div className="leader-content"><h3>{person.name}</h3><span>{person.role}</span><p>{person.bio}</p></div></article>)}</div></section>

        <section className="services-section section-pad" id="services">
          <div className="section-heading-row">
            <div><div className="section-kicker">Services we offer <span /></div><h2>Your premier partner for <span>comprehensive financial solutions.</span></h2></div>
            <p>Explore our comprehensive suite of financial services designed to drive your business’s success.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <a className="service-card" href="#contact" key={service.number}>
                <div className="service-image"><img src={service.image} alt="" /><span className="service-number">{service.number}</span><span className="service-arrow"><ArrowUpRight size={19} /></span></div>
               <div className="service-content"><h3>{service.title}</h3><span className="learn-more">Learn more <ArrowUpRight size={15} /></span></div>
              </a>
            ))}
          </div>
          <a className="button button-outline" href="#contact">View all services <ArrowUpRight size={17} /></a>
        </section>

        <section className="partners-section section-pad" aria-labelledby="partners-title">
          <div className="partners-intro"><div><div className="section-kicker">Highlighted partners <span /></div><h2 id="partners-title">Highlighted <span>partners.</span></h2></div></div>
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
           <div className="testimonial-viewport" aria-live="polite"><div className="testimonial-track" style={{ transform: `translateX(-${testimonial * 100}%)` }}>{testimonials.map((review) => <div className="testimonial-card" key={review.name}><div className="quote-mark">“</div><blockquote>{review.quote}</blockquote><div className="testimonial-author"><span className="avatar">{review.initials}</span><span><strong>{review.name}</strong>{review.role && <small>{review.role}</small>}</span></div><div className="google-note"><span className="google-g">G</span> Verified Google review</div></div>)}</div></div>
        </section>

          <section className="insights section-pad" id="insights">
           <div className="section-heading-row"><div><div className="section-kicker">Recent blog posts <span /></div><h2>Overdrive Accounting Services <span>blog.</span></h2></div><a className="text-link" href="https://www.irs.gov/newsroom" target="_blank" rel="noreferrer">Follow IRS updates <ArrowUpRight size={17} /></a></div>
           <div className="insight-filters" aria-label="Filter insights">{['All updates', 'Tax & IRS', 'Tax law', 'Accounting', 'Payroll & HR'].map((category) => <button className={insightCategory === category ? 'active' : ''} key={category} onClick={() => setInsightCategory(category)}>{category}</button>)}</div>
           <div className="insights-grid"><article className="featured-insight"><div className="insight-image"><img src={visibleInsights[0].image} alt="" /><span>{visibleInsights[0].category}</span></div><div className="insight-meta">{visibleInsights[0].date}{visibleInsights[0].readTime && <><span>•</span> {visibleInsights[0].readTime}</>}</div><h3>{visibleInsights[0].title}</h3>{visibleInsights[0].summary && <p className="insight-summary">{visibleInsights[0].summary}</p>}{visibleInsights[0].source === 'Overdrive Accounting Services' ? <button className="text-link insight-button" onClick={() => openBlog(visibleInsights[0])}>Read article <ArrowUpRight size={16} /></button> : <a className="text-link" href={visibleInsights[0].sourceUrl} target="_blank" rel="noreferrer">Read source: {visibleInsights[0].source} <ArrowUpRight size={16} /></a>}</article><div className="insight-list">{visibleInsights.slice(1).map((post, index) => <article key={post.title}><span className="insight-index">{String(index + 1).padStart(2, '0')}</span><div><div className="insight-meta">{post.date} <span>•</span> {post.category}</div><h3>{post.title}</h3>{post.summary && <p>{post.summary}</p>}{post.source === 'Overdrive Accounting Services' ? <button className="insight-list-button" onClick={() => openBlog(post)}>Read article <ArrowUpRight size={15} /></button> : <a href={post.sourceUrl} target="_blank" rel="noreferrer">Read source <ArrowUpRight size={15} /></a>}</div></article>)}</div></div>
          </section>

         <section className="appointment-section section-pad" id="appointment"><div className="appointment-layout"><div className="appointment-copy"><div className="section-kicker">Start with a conversation <span /></div><h2>Let’s find the <span>right next step.</span></h2><p>Tell us a little about your business and choose a preferred date. Our team will follow up to confirm the conversation.</p><div className="appointment-details"><span>01</span><p>Submit your request</p><span>02</span><p>We confirm the time</p><span>03</span><p>We get to work</p></div></div><div className="appointment-card"><div className="appointment-card-top"><span>Free consultation</span><small>Usually 30 minutes</small></div><AppointmentForm /></div></div></section>

         <section className="contact-section" id="contact"><div className="contact-bg-word">OVERDRIVE</div><div className="contact-inner"><div className="section-kicker eyebrow-light">Ready to get started <span /></div><h2>Ready to push your business into <em>overdrive?</em></h2><p>Schedule a free consultation and discover how Overdrive Accounting Services can elevate your business to new heights.</p><a className="button button-accent" href="#appointment">Schedule a free consultation <ArrowUpRight size={18} /></a></div><div className="contact-curve" /></section>
         {blogLoading && <div className="blog-loading">Loading article...</div>}
         {blogError && <div className="blog-error">{blogError}</div>}
         {selectedBlog && <BlogModal article={selectedBlog} onClose={() => setSelectedBlog(null)} />}
      </main>

      <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><img src={siteLogo} alt="Overdrive Accounting Services" /><p>Strategic accounting and business support for owners ready to move forward.</p><a className="footer-email" href="mailto:Info@OverdriveAccountingServices.com">Info@OverdriveAccountingServices.com <ArrowUpRight size={15} /></a></div><div className="footer-links"><div><span>Explore</span><a href="#about">About us</a><a href="#services">Services</a><a href="#insights">Insights</a></div><div><span>Connect</span><a href="tel:352-749-2459">(352) 749-2459</a><a href="#appointment">Free consultation</a><a href={clientPortalUrl}>Client portal</a></div><div><span>Visit</span><a href="https://maps.google.com/?q=9100+Conroy+Windermere+Road+Windermere+FL+34786">9100 Conroy Windermere Road<br />Suite 200<br />Windermere, FL 34786</a></div></div></div><div className="footer-bottom"><span>© 2024 Overdrive Accounting Services, LLC</span></div></footer>
    </div>
  )
}

function App() {
  const route = window.location.pathname.replace(/\/+$/, '') || '/'
  if (route === '/admin') return <AdminDashboard />
  if (route === '/portal') return <PortalRedirect />
  return <MarketingSite />
}

function PortalRedirect() {
  useEffect(() => { window.location.replace(clientPortalUrl) }, [])
  return <div className="portal-page"><main className="portal-content"><p>Redirecting to the secure client portal...</p></main></div>
}

function BlogModal({ article, onClose }) {
  return <div className="blog-modal-backdrop" onMouseDown={onClose}><article className="blog-modal" onMouseDown={(event) => event.stopPropagation()}><button className="blog-modal-close" onClick={onClose} aria-label="Close article">X</button><span className="section-kicker">Overdrive Accounting Services Blog <span /></span><h2>{article.title}</h2><div className="blog-modal-date">{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div><div className="blog-modal-content" dangerouslySetInnerHTML={{ __html: article.content }} /></article></div>
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
