export default function Brand({ footer = false, href = '#inicio' }) {
  return <a className={`brand${footer ? ' brand-footer' : ''}`} href={href} aria-label="Talenty, início"><img className="brand-logo" src="/images/logo-removebg-preview.png" alt="" width="40" height="40" /><span>Talenty</span></a>;
}
