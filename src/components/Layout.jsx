import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icons.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

const TABS = [
  ['/', 'Explore', 'compass'],
  ['/events', 'Events', 'calendar'],
  ['/retreats', 'Retreats', 'tent'],
  ['/riders', 'Riders', 'users'],
  ['/groms', 'Groms', 'heart'],
  ['/you', 'You', 'user'],
];

export default function Layout({ children }) {
  const { me, setMe, setUsage, openFeedback, config } = useApp();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setMe(null); setUsage(null); setOpen(false); nav('/'); };
  const isChat = /^\/messages\/.+/.test(loc.pathname);
  const isActive = (to) => (to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to));

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo" aria-label="Riders Plus home">Riders <span>Plus</span></Link>
          <nav className="desk-nav" aria-label="Main">
            {TABS.slice(0, 5).map(([to, label]) => <NavLink key={to} to={to} className={isActive(to) ? 'active' : ''} end={to === '/'}>{label === 'Riders' ? 'Find your rider' : label === 'Groms' ? 'Sponsor a Grom' : label}</NavLink>)}
          </nav>
          <div className="header-actions">
            {me && <Link to="/messages" className="icon-btn" aria-label="Messages"><Icon name="message" /></Link>}
            {me ? <Link to="/you" className="icon-btn" aria-label="Your profile" style={{ padding: 0, overflow: 'hidden' }}><Avatar user={me} size={40} /></Link>
              : <Link to="/signup" className="btn primary sm">Join free</Link>}
            <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Icon name="menu" /></button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="logo">Riders <span>Plus</span></span>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" /></button>
            </div>
            {me && <div className="card flat row" style={{ marginBottom: 8, flexWrap: 'nowrap' }}><Avatar user={me} size={40} /><div style={{ minWidth: 0 }}><b>{me.name}</b><div className="xs muted">{me.tier === 'plus' ? 'Plus member' : 'Basic member (free)'}</div></div></div>}
            <nav aria-label="Menu links">
              {TABS.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon name={icon} /> {label === 'Riders' ? 'Find your rider' : label === 'Groms' ? 'Sponsor a Grom' : label === 'You' ? 'Your profile' : label}</NavLink>)}
              <NavLink to="/messages"><Icon name="message" /> Messages</NavLink>
              <NavLink to="/events/new"><Icon name="plus" /> Post an event</NavLink>
              <NavLink to="/providers/ride-with-us-retreats"><Icon name="shield" /> Ride With Us Retreats</NavLink>
              {me?.is_admin && <NavLink to="/admin"><Icon name="lock" /> Admin panel</NavLink>}
              <hr />
              <button onClick={() => { setOpen(false); openFeedback(); }}><Icon name="bug" /> Report a bug / suggest a feature</button>
              <NavLink to="/guidelines"><Icon name="shieldAlert" /> Community guidelines</NavLink>
              <NavLink to="/privacy"><Icon name="lock" /> Privacy</NavLink>
              <NavLink to="/terms"><Icon name="ticket" /> Terms</NavLink>
              <a href={`mailto:${config.contactEmail}`}><Icon name="mail" /> {config.contactEmail}</a>
              <hr />
              {me ? <button onClick={logout}><Icon name="logout" /> Log out</button>
                : <><NavLink to="/login"><Icon name="user" /> Log in</NavLink><NavLink to="/signup"><Icon name="sparkles" /> Join free</NavLink></>}
            </nav>
          </aside>
        </>
      )}

      <main className={isChat ? 'main-chat' : ''}>{children}</main>

      {!isChat && <footer className="footer">
        <div className="footer-inner">
          <b style={{ color: 'var(--fg)' }}>Riders Plus</b><span>by Ride With Us Retreats · Fuerteventura</span>
          <Link to="/privacy">Privacy</Link><Link to="/guidelines">Community guidelines</Link><Link to="/terms">Terms</Link>
          <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
          {me?.is_admin && <Link to="/admin">Admin</Link>}
        </div>
      </footer>}

      {!isChat && <button className="fab" onClick={openFeedback} aria-label="Report a bug or suggest a feature" data-testid="feedback-fab"><Icon name="bug" size={16} /> Report a bug</button>}

      <nav className="tabbar" aria-label="Tabs">
        {TABS.map(([to, label, icon]) => (
          <Link key={to} to={to} className={isActive(to) ? 'active' : ''} aria-current={isActive(to) ? 'page' : undefined}>
            <Icon name={icon} size={22} /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
