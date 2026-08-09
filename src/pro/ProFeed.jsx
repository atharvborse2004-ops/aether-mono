import { Link } from 'react-router-dom'
import Home from '../screens/Home.jsx'
import Icon from '../components/Icon.jsx'

/**
 * The consultant's feed is the same feed.
 *
 * Home already resolves the `feed` pointer list through seven card types
 * (post, reel, reading, article, live, course, product) — around 370 lines. A
 * second copy would drift the moment either side gained a card type, so this
 * renders Home and swaps only the header action: compose, instead of the
 * seeker's daily horoscope.
 *
 * `<main key={pathname}>` in the shell remounts between /home and /pro/feed,
 * so no scroll position or card state leaks across the switch.
 */
export default function ProFeed() {
  return (
    <Home
      action={
        <Link
          to="/pro/studio"
          aria-label="Post something"
          className="pill knob !h-9 !w-9 justify-center"
        >
          <Icon name="plus" size={18} />
        </Link>
      }
    />
  )
}
