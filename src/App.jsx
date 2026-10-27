import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { AppCtx } from './ctx.js';
import Layout from './components/Layout.jsx';
import PlusSheet from './components/PlusSheet.jsx';
import FeedbackSheet from './components/FeedbackSheet.jsx';
import Home from './pages/Home.jsx';
import Events from './pages/Events.jsx';
import EventDetail from './pages/EventDetail.jsx';
import PostEvent from './pages/PostEvent.jsx';
import Checkout from './pages/Checkout.jsx';
import Retreats from './pages/Retreats.jsx';
import RetreatDetail from './pages/RetreatDetail.jsx';
import Provider from './pages/Provider.jsx';
import Riders from './pages/Riders.jsx';
import RiderProfile from './pages/RiderProfile.jsx';
import Messages from './pages/Messages.jsx';
import Chat from './pages/Chat.jsx';
import Groms from './pages/Groms.jsx';
import Profile from './pages/Profile.jsx';
import { Login, Signup } from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import Search from './pages/Search.jsx';
import { Privacy, Guidelines, Terms, NotFound } from './pages/Legal.jsx';

export default function App() {
  const [me, setMe] = useState(null);
  const [usage, setUsage] = useState(null);
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);
  const [plus, setPlus] = useState(null);
  const [feedback, setFeedback] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const loc = useLocation();

  const refresh = useCallback(async () => {
    const r = await api('/me');
    setMe(r.user); setUsage(r.usage);
    return r;
  }, []);
  useEffect(() => {
    Promise.all([api('/config').then(setConfig), refresh()]).catch(() => {}).finally(() => setReady(true));
  }, [refresh]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { if (!toastMsg) return undefined; const t = setTimeout(() => setToastMsg(''), 2800); return () => clearTimeout(t); }, [toastMsg]);

  const ctx = { me, setMe, usage, setUsage, config, refresh, ready, toast: setToastMsg, openPlus: setPlus, openFeedback: () => setFeedback(true) };
  if (!ready || !config) return <div className="empty" style={{ paddingTop: '40vh' }}>Loading Riders Plus…</div>;
  return (
    <AppCtx.Provider value={ctx}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/new" element={<PostEvent />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/retreats" element={<Retreats />} />
          <Route path="/retreats/:slug" element={<RetreatDetail />} />
          <Route path="/providers/:slug" element={<Provider />} />
          <Route path="/riders" element={<Riders />} />
          <Route path="/riders/:id" element={<RiderProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Chat />} />
          <Route path="/groms" element={<Groms />} />
          <Route path="/you" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/search" element={<Search />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      {plus && <PlusSheet feature={plus} onClose={() => setPlus(null)} />}
      {feedback && <FeedbackSheet onClose={() => setFeedback(false)} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </AppCtx.Provider>
  );
}
