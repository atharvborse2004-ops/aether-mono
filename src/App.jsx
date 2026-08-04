import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useStore } from './store.jsx'
import { BottomNav, Toast } from './components/Chrome.jsx'

import Intro from './screens/onboarding/Intro.jsx'
import AskName from './screens/onboarding/AskName.jsx'
import AskDate from './screens/onboarding/AskDate.jsx'
import AskTime from './screens/onboarding/AskTime.jsx'
import AskPlace from './screens/onboarding/AskPlace.jsx'
import Computing from './screens/onboarding/Computing.jsx'

import Home from './screens/Home.jsx'
import Horoscope from './screens/Horoscope.jsx'
import Consult from './screens/Consult.jsx'
import Ask from './screens/Ask.jsx'
import Shop from './screens/Shop.jsx'

import Profile from './screens/Profile.jsx'
import Chart from './screens/Chart.jsx'
import Placement from './screens/Placement.jsx'
import People from './screens/People.jsx'
import Synastry from './screens/Synastry.jsx'
import Invite from './screens/Invite.jsx'
import Article from './screens/Article.jsx'
import ReelViewer from './screens/ReelViewer.jsx'
import LiveRoom from './screens/LiveRoom.jsx'
import ConsultantProfile from './screens/ConsultantProfile.jsx'
import Notifications from './screens/Notifications.jsx'
import Premium from './screens/Premium.jsx'

/** Tab shell — nav takes real layout space rather than floating over content. */
function TabLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <main key={pathname} className="no-scrollbar min-h-0 flex-1 animate-fade overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}

/** Shell for onboarding and drill-in screens — no bottom nav. */
function PlainLayout() {
  const { pathname } = useLocation()
  return (
    <main key={pathname} className="no-scrollbar min-h-0 flex-1 animate-fade overflow-y-auto">
      <Outlet />
    </main>
  )
}

function Frame() {
  const { toast } = useStore()

  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-black">
      <div className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden border-x border-rule bg-bg text-t1">
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />

          <Route element={<PlainLayout />}>
            <Route path="/onboarding" element={<Intro />} />
            <Route path="/onboarding/name" element={<AskName />} />
            <Route path="/onboarding/date" element={<AskDate />} />
            <Route path="/onboarding/time" element={<AskTime />} />
            <Route path="/onboarding/place" element={<AskPlace />} />
            <Route path="/onboarding/computing" element={<Computing />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/chart" element={<Chart />} />
            <Route path="/chart/:id" element={<Placement />} />
            <Route path="/people" element={<People />} />
            <Route path="/people/invite" element={<Invite />} />
            <Route path="/people/:id" element={<Synastry />} />
            <Route path="/read/:id" element={<Article />} />
            <Route path="/reels/:id" element={<ReelViewer />} />
            <Route path="/live/:id" element={<LiveRoom />} />
            <Route path="/consult/:id" element={<ConsultantProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/premium" element={<Premium />} />
          </Route>

          {/* The five destinations, in the reference app's order. */}
          <Route element={<TabLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/horoscope" element={<Horoscope />} />
            <Route path="/consult" element={<Consult />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/shop" element={<Shop />} />
          </Route>

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>

        <Toast message={toast} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Frame />
    </AppProvider>
  )
}
