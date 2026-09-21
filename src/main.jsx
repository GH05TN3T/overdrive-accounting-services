import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  FileCheck2,
  Menu,
  Minus,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import './styles.css'

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

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [testimonial, setTestimonial] = useState(0)

  useEffect(() => {
    const rotation = setInterval(() => {
      setTestimonial((current) => (current + 1) % testimonials.length)
    }, 6500)

    return () => clearInterval(rotation)
  }, [])

  const closeMenu = () => setMenuOpen(false)

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
          <a href="#services" onClick={closeMenu}>Services</a>
          <a href="#approach" onClick={closeMenu}>Our approach</a>
          <a href="#about" onClick={closeMenu}>About us</a>
          <a href="#insights" onClick={closeMenu}>Insights</a>
          <a className="nav-phone" href="tel:352-749-2459" onClick={closeMenu}><Phone size={15} /> (352) 749-2459</a>
          <a className="button button-small" href="#contact" onClick={closeMenu}>Let's talk <ArrowUpRight size={16} /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-gridlines" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> Strategic finance for ambitious owners</div>
            <h1>Turn your numbers into <em>momentum.</em></h1>
            <p className="hero-lede">Accounting should do more than keep up. Overdrive gives you the clarity, strategy, and support to move your business forward with confidence.</p>
            <div className="hero-actions">
              <a className="button button-accent" href="#contact">Schedule a free consultation <ArrowUpRight size={18} /></a>
              <a className="text-link text-link-light" href="#approach"><span className="play-icon"><Play size={11} fill="currentColor" /></span> See how we work</a>
            </div>
            <div className="hero-assurance"><ShieldCheck size={17} /> Trusted financial guidance for businesses at every stage</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-wrap">
              <img src={`${assetRoot}2024/06/AboutUS.jpg`} alt="Overdrive team meeting with a business owner" />
              <div className="photo-label"><span>01</span><span className="label-line" /><span>Clarity creates action</span></div>
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
          <div className="section-kicker">A better way forward <span /></div>
          <div className="intro-layout">
            <h2>The accounting partner <span>you deserve.</span></h2>
            <div className="intro-body">
              <p>Numbers tell a story. Our job is to make sure it is one you can act on.</p>
              <p>Overdrive Accounting Services brings together meticulous financial management and practical business insight. We make the complicated feel clear, so you can spend less time chasing answers and more time building what is next.</p>
              <a className="text-link" href="#contact">Get to know Overdrive <ArrowUpRight size={17} /></a>
            </div>
          </div>
          <div className="metric-row">
            <div className="metric"><strong>24<span>hr</span></strong><span>Typical response time</span></div>
            <div className="metric"><strong>360<span>°</span></strong><span>A complete view of your business</span></div>
            <div className="metric"><strong>1</strong><span>Partner for every stage of growth</span></div>
          </div>
        </section>

        <section className="services-section section-pad" id="services">
          <div className="section-heading-row">
            <div><div className="section-kicker">What we do <span /></div><h2>Built around <span>your next move.</span></h2></div>
            <p>From day-to-day books to big-picture decisions, our services work together to keep your business in motion.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <a className="service-card" href="#contact" key={service.number}>
                <div className="service-image"><img src={service.image} alt="" /><span className="service-number">{service.number}</span><span className="service-arrow"><ArrowUpRight size={19} /></span></div>
                <div className="service-content"><h3>{service.title}</h3><p>{service.description}</p><span className="learn-more">Explore service <ArrowUpRight size={15} /></span></div>
              </a>
            ))}
          </div>
          <a className="button button-outline" href="#contact">View all services <ArrowUpRight size={17} /></a>
        </section>

        <section className="partners-section section-pad" aria-labelledby="partners-title">
          <div className="partners-intro"><div><div className="section-kicker">A growing community <span /></div><h2 id="partners-title">Built with businesses <span>like yours.</span></h2></div><p>From local teams to growing companies, we are proud to be the financial partner behind the work that keeps Central Florida moving.</p></div>
          <div className="partner-marquee" aria-label="Overdrive clients and partners"><div className="partner-track">{[...partnerLogos, ...partnerLogos].map((partner, index) => <div className="partner-logo" key={`${partner.name}-${index}`} aria-hidden={index >= partnerLogos.length}><img src={partner.image} alt={index >= partnerLogos.length ? '' : partner.name} loading="lazy" /></div>)}</div></div>
        </section>

        <section className="approach section-pad" id="approach">
          <div className="approach-image"><img src={`${assetRoot}2024/06/LoanApplication.jpg`} alt="Business owner reviewing a financial plan" /><div className="image-stamp"><Sparkles size={17} /><span>Strategy<br />in motion</span></div></div>
          <div className="approach-copy"><div className="section-kicker">The Overdrive difference <span /></div><h2>Clear numbers. <span>Confident decisions.</span></h2><p className="large-copy">We are not just here to report on what happened. We help you understand what is possible, then build the financial foundation to get there.</p>
            <div className="approach-list"><div><div className="approach-icon"><BarChart3 size={20} /></div><div><h3>See the full picture</h3><p>Financial reporting that turns noise into a clear direction.</p></div></div><div><div className="approach-icon"><FileCheck2 size={20} /></div><div><h3>Stay ahead of the details</h3><p>Proactive support that keeps small issues from becoming big ones.</p></div></div><div><div className="approach-icon"><Clock3 size={20} /></div><div><h3>Make time for growth</h3><p>A trusted team in your corner, ready when you need us.</p></div></div></div>
            <a className="text-link" href="#contact">Why business owners choose us <ArrowUpRight size={17} /></a>
          </div>
        </section>

        <section className="testimonial-section section-pad">
          <div className="testimonial-top"><div><div className="section-kicker">Proof in progress <span /></div><h2>Our clients say <span>it best.</span></h2></div><div className="slider-controls"><button onClick={() => setTestimonial((testimonial - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial">←</button><span>0{testimonial + 1} <i>/</i> 0{testimonials.length}</span><button onClick={() => setTestimonial((testimonial + 1) % testimonials.length)} aria-label="Next testimonial">→</button></div></div>
          <div className="testimonial-viewport" aria-live="polite"><div className="testimonial-track" style={{ transform: `translateX(-${testimonial * 100}%)` }}>{testimonials.map((review) => <div className="testimonial-card" key={review.name}><div className="quote-mark">“</div><blockquote>{review.quote}</blockquote><div className="testimonial-author"><span className="avatar">{review.initials}</span><span><strong>{review.name}</strong><small>{review.role}</small></span></div><div className="google-note"><span className="google-g">G</span> Verified Google review</div></div>)}</div></div>
        </section>

        <section className="insights section-pad" id="insights">
          <div className="section-heading-row"><div><div className="section-kicker">From the journal <span /></div><h2>Useful thinking for <span>business owners.</span></h2></div><a className="text-link" href="#contact">View all insights <ArrowUpRight size={17} /></a></div>
          <div className="insights-grid"><article className="featured-insight"><div className="insight-image"><img src={`${assetRoot}2024/06/Taxes2.jpg`} alt="Tax documents on a desk" /><span>Tax strategy</span></div><div className="insight-meta">April 22, 2025 <span>•</span> 5 min read</div><h3>2025 tax season checklist: Is your business ready?</h3><a className="text-link" href="#contact">Read article <ArrowUpRight size={16} /></a></article><div className="insight-list"><article><span className="insight-index">01</span><div><div className="insight-meta">March 10, 2025 <span>•</span> Tax strategy</div><h3>Avoid these common tax filing mistakes and save big this year</h3><a href="#contact">Read article <ArrowUpRight size={15} /></a></div></article><article><span className="insight-index">02</span><div><div className="insight-meta">February 10, 2025 <span>•</span> Business growth</div><h3>Top tax deductions every small business should know</h3><a href="#contact">Read article <ArrowUpRight size={15} /></a></div></article></div></div>
        </section>

        <section className="contact-section" id="contact"><div className="contact-bg-word">OVERDRIVE</div><div className="contact-inner"><div className="section-kicker eyebrow-light">Ready when you are <span /></div><h2>Let’s put your business <em>in motion.</em></h2><p>Tell us where you are headed. We’ll help you build the financial clarity to get there.</p><a className="button button-accent" href="mailto:Info@OverdriveAccountingServices.com">Start a conversation <ArrowUpRight size={18} /></a></div><div className="contact-curve" /></section>
      </main>

      <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><img src={siteLogo} alt="Overdrive Accounting Services" /><p>Strategic accounting and business support for owners ready to move forward.</p><a className="footer-email" href="mailto:Info@OverdriveAccountingServices.com">Info@OverdriveAccountingServices.com <ArrowUpRight size={15} /></a></div><div className="footer-links"><div><span>Explore</span><a href="#about">About us</a><a href="#services">Services</a><a href="#insights">Insights</a></div><div><span>Connect</span><a href="tel:352-749-2459">(352) 749-2459</a><a href="#contact">Free consultation</a><a href="https://overdriveaccountingservices.securefilepro.com">Client portal</a></div><div><span>Visit</span><a href="https://maps.google.com/?q=9100+Conroy+Windermere+Road+Windermere+FL+34786">9100 Conroy Windermere Road<br />Suite 200<br />Windermere, FL 34786</a></div></div></div><div className="footer-bottom"><span>© 2024 Overdrive Accounting Services, LLC</span></div></footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
