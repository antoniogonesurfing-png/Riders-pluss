import { Link } from 'react-router-dom';
import { useApp } from '../ctx.js';

function Doc({ title, updated, children }) {
  return <article className="page-narrow prose"><div className="eyebrow">Riders Plus</div><h1>{title}</h1><p className="muted small">Last updated {updated}</p>{children}</article>;
}

export function Privacy() {
  const { config } = useApp();
  const m = <a className="link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>;
  return (
    <Doc title="Privacy policy" updated="27 October 2026">
      <p><b>Controller:</b> Ride With Us Retreats, Fuerteventura, Canary Islands, Spain · {m}</p>
      <p>Riders Plus is a test version of a community app for outdoor and adventure sports in the Canary Islands. This policy explains what we store, why, and your rights under the EU General Data Protection Regulation (GDPR).</p>
      <h2>What we store</h2>
      <ul>
        <li><b>Account:</b> name, email, password (stored only as a secure hash, never in plain text), date of birth (to check you are 18+), and when you accepted the guidelines.</li>
        <li><b>Profile:</b> sports, level, island, town, bio and any photos you upload.</li>
        <li><b>Activity:</b> likes and passes, matches, chat messages, event RSVPs, events you post and their review status.</li>
        <li><b>Requests and forms:</b> retreat enquiries (shared with the retreat provider you contact), Sponsor a Grom nominations (guardian contact details and the information the guardian gives), sponsorship records, and bug reports or ideas you send.</li>
        <li><b>Payments:</b> in this test version no card data is processed; we only record test payment amounts and status. When real payments launch they will be handled by a payment provider (e.g. Stripe), and we will never see full card numbers.</li>
        <li><b>Technical:</b> a session cookie that keeps you logged in, and your browser type when you send feedback. No advertising or tracking cookies.</li>
      </ul>
      <h2>Why, and on what legal basis</h2>
      <ul>
        <li>To run your account, matching, chat and listings: performance of a contract.</li>
        <li>To keep the community safe (age checks, moderation, reports): legitimate interest and legal obligations.</li>
        <li>To send you news about future Riders Plus launches: <b>only if you opt in</b> at sign-up or in your profile (consent). You can withdraw at any time.</li>
        <li>Sponsor a Grom nominations: consent of the parent or legal guardian, which they can withdraw at any time.</li>
      </ul>
      <h2>Who sees your data</h2>
      <p>Other members see your public profile (name, sports, level, island, town, bio, photos, age). Retreat enquiries go to the named provider. We do not sell personal data. Hosting providers process data on our behalf under data-processing agreements.</p>
      <h2>How long we keep it</h2>
      <p>While your account is active. If you ask us to delete your account we remove your profile, matches and messages within 30 days, except records we must keep by law.</p>
      <h2>Your rights</h2>
      <p>You can ask to access, correct, delete, restrict or port your data, object to processing, and withdraw consent at any time by emailing {m}. You can also complain to the Spanish data protection authority (Agencia Española de Protección de Datos, aepd.es).</p>
      <h2>Children</h2>
      <p>Accounts are for adults (18+). Information about young riders is only accepted from their parent or legal guardian through Sponsor a Grom, and nothing is published without the guardian's separate written consent.</p>
    </Doc>
  );
}

export function Guidelines() {
  const { config } = useApp();
  return (
    <Doc title="Community guidelines" updated="27 October 2026">
      <p>Riders Plus works because people show up honestly and look after each other, on the water, on the trail and around the table.</p>
      <h2>Be real</h2>
      <ul><li>Use your own photos and your real name or the name people know you by.</li><li>Describe your level honestly. Overstating it puts you and others in danger.</li><li>One account per person. No impersonation.</li><li>Test bots are always labelled "Test bot" and "(Bot)". Real members must never pretend to be bots, or bots to be real.</li></ul>
      <h2>Be respectful</h2>
      <ul><li>No harassment, threats, hate speech or discrimination.</li><li>No sexual content or unsolicited sexual messages. This is not a dating app.</li><li>Take "no" or silence as an answer.</li></ul>
      <h2>Be safe</h2>
      <ul><li>Meet in public the first time and tell someone where you are going.</li><li>Check conditions, equipment and insurance before any activity. Never pressure anyone into conditions beyond their level.</li><li>Events and retreats are run by independent organisers and providers; check details with them.</li></ul>
      <h2>Safeguarding children and young people</h2>
      <ul>
        <li>Crew matching and chat are for adults only (18+). Under-18s may not create accounts.</li>
        <li>Never use Riders Plus to contact a child. Young riders can only be nominated for Sponsor a Grom by a parent or legal guardian, and all contact goes through the guardian.</li>
        <li>Do not post photos, names, schools or locations of children in profiles, chats or events.</li>
        <li>Any sponsor, coach or volunteer who works with groms in person must agree arrangements with the guardian and follow the club's or school's safeguarding policy. One-to-one unsupervised contact arranged through the app is not allowed.</li>
        <li>If you are worried about a child, contact the local emergency services (112) first, then tell us at <a className="link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>. We act on every report.</li>
      </ul>
      <h2>Events and listings</h2>
      <ul><li>Only post real, legal events you are allowed to share. Paid listings and featured boosts are still reviewed.</li><li>No commercial spam in profiles or chats.</li></ul>
      <h2>Reporting</h2>
      <p>Use the "Report a bug" button on any page or email us. Breaking these rules can lead to removal of content or accounts.</p>
    </Doc>
  );
}

export function Terms() {
  const { config } = useApp();
  return (
    <Doc title="Terms of use" updated="27 October 2026">
      <p><b>Operator:</b> Ride With Us Retreats, Fuerteventura, Canary Islands, Spain · <a className="link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></p>
      <h2>Test version</h2>
      <p>Riders Plus is in testing before its main launch. Features may change, and data in this test version may be reset. Payments shown are in TEST MODE and no money is charged.</p>
      <h2>What Riders Plus is</h2>
      <p>A networking platform that helps people find events, retreats and other riders. Events and retreats are run by independent organisers and providers; any booking is between you and them. Ride With Us Retreats appears as one of those providers.</p>
      <h2>Your account</h2>
      <ul><li>You must be 18 or over.</li><li>Basic membership is free. Plus is a planned paid tier; nothing is charged for Plus in this version.</li><li>Follow the <Link className="link" to="/guidelines">community guidelines</Link>.</li></ul>
      <h2>Risk</h2>
      <p>Outdoor and water sports are inherently risky. You are responsible for your own safety, level and equipment, and for checking conditions and insurance.</p>
      <h2>Listings</h2>
      <p>Paid events need a listing fee (minimum €{config.paidEventMinListingFeeEur}). All listings are reviewed and may be rejected if they break the guidelines.</p>
    </Doc>
  );
}

export function NotFound() {
  return <div className="card empty stack page-narrow"><h2>Page not found</h2><p>This trail doesn't exist or has moved.</p><Link className="btn primary" to="/">Go home</Link></div>;
}
