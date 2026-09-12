import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  MapPin,
  ArrowRight,
  Music2,
  Cpu,
  Palette,
  Trophy,
  Sparkles,
  Ticket,
  CalendarDays,
} from "lucide-react";
import { api } from "./api";
import { useAuth } from "./auth";
import type { ApiResponse, Event } from "./types";
import { EventCard } from "./EventCard";
const categories = [
  { name: "Music", label: "Turn it up", Icon: Music2, color: "peach" },
  { name: "Tech", label: "Meet your next idea", Icon: Cpu, color: "lilac" },
  {
    name: "Art",
    label: "Make something yours",
    Icon: Palette,
    color: "yellow",
  },
  { name: "Sports", label: "Get in the game", Icon: Trophy, color: "green" },
];
export function Landing() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const hostUrl =
    user?.role === "ORGANIZER"
      ? "/organizer/events/new"
      : user?.role === "ADMIN"
        ? "/admin/events"
        : "/register";
  const events = useQuery({
    queryKey: ["events", "featured"],
    queryFn: () =>
      api
        .get<ApiResponse<{ items: Event[]; pagination: { total: number } }>>(
          "/events",
          { params: { limit: 3 } },
        )
        .then((r) => r.data.data),
  });
  function discover(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());
    navigate(`/events?${params}`);
  }
  return (
    <>
      <section className="discovery-hero">
        <div className="container-page hero-layout">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span /> Your offline era starts here
            </p>
            <h1>
              Great plans.
              <br />
              Better <span className="hero-script">stories.</span>
              <Sparkles aria-hidden="true" className="hero-spark" />
            </h1>
            <p className="hero-description">
              Front-row moments. New favourite people.
              <br className="hidden sm:block" /> Find the experiences that make
              you feel alive.
            </p>
            <div className="hero-actions">
              <a href="#coming-up" className="btn-primary gap-3">
                Explore experiences <ArrowUpRight size={19} />
              </a>
              <Link to={hostUrl} className="hero-text-link">
                Host an event <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-note">
              <div className="note-icon">
                <Ticket size={19} />
              </div>
              <div>
                <strong>Less ordinary. More out there.</strong>
                <span>Music, culture, ideas & everything in between.</span>
              </div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-poster">
              <img
                src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1100&q=85"
                alt="Friends sharing a live concert experience"
                fetchPriority="high"
              />
              <div className="poster-shade" />
              <span className="poster-tag">
                <span /> THE MOMENTS THAT STAY
              </span>
              <div className="poster-caption">
                <p>FOR THE LOVE OF LIVE</p>
                <h2>
                  You had to
                  <br />
                  be there.
                </h2>
                <Link to="/events?category=Music">
                  Find your next live show <ArrowUpRight size={20} />
                </Link>
              </div>
            </div>
            <div className="poster-stamp" aria-hidden="true">
              <Sparkles size={23} />
              <span>
                GO MAKE
                <br />A MEMORY
              </span>
            </div>
            <Link to="/events?sort=date" className="floating-ticket">
              <div className="ticket-mini-icon">
                <CalendarDays size={24} />
              </div>
              <div>
                <span>ON THE AGENDA</span>
                <strong>Your next good time</strong>
                <small>Discover what's coming up</small>
              </div>
              <ArrowUpRight size={23} />
            </Link>
            <span className="hero-art-note" aria-hidden="true">
              Be a little more spontaneous.
            </span>
          </div>
        </div>
        <div className="container-page">
          <form onSubmit={discover} className="discovery-search">
            <label>
              <Search size={23} />
              <div>
                <span className="search-label">WHAT ARE YOU INTO?</span>
                <input
                  aria-label="Search experiences"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="An artist, event or a new interest"
                />
              </div>
            </label>
            <label>
              <MapPin size={23} />
              <div>
                <span className="search-label">WHERE'S THE PLAN?</span>
                <input
                  aria-label="Search city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                  list="evently-cities"
                />
                <datalist id="evently-cities">
                  <option value="New Delhi" />
                  <option value="Gurugram" />
                  <option value="Noida" />
                  <option value="Mumbai" />
                  <option value="Bengaluru" />
                </datalist>
              </div>
            </label>
            <button className="btn-primary gap-3" type="submit">
              Find my next plan <ArrowRight size={19} />
            </button>
          </form>
        </div>
      </section>
      <section className="container-page category-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A little something for everyone</p>
            <h2>Follow your kind of fun.</h2>
          </div>
          <Link className="section-link" to="/events">
            View all categories <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map(({ name, label, Icon, color }) => (
            <Link
              className={`category-tile ${color}`}
              key={name}
              to={`/events?category=${name}`}
            >
              <span className="category-icon">
                <Icon size={25} strokeWidth={1.6} />
              </span>
              <div>
                <strong>{name}</strong>
                <span>{label}</span>
              </div>
              <ArrowUpRight className="category-arrow" size={21} />
            </Link>
          ))}
        </div>
      </section>
      <section id="coming-up" className="upcoming-section">
        <div className="container-page">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Make some room on your calendar</p>
              <h2>Good things are coming.</h2>
            </div>
            <Link className="section-link" to="/events">
              Browse all events <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="upcoming-caption">
            <span className="live-dot" />{" "}
            {events.data
              ? `${events.data.pagination.total} upcoming experiences to discover`
              : "Your next great experience is out there"}
            <span className="hidden sm:inline">
              Handpicked plans. Unforgettable moments.
            </span>
          </div>
          {events.isPending ? (
            <div
              className="grid gap-6 sm:grid-cols-3"
              aria-label="Loading events"
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-96 animate-pulse rounded-3xl bg-slate-100"
                />
              ))}
            </div>
          ) : events.isError ? (
            <div className="card p-8">
              Unable to load events.{" "}
              <button
                className="text-brand-700 underline"
                onClick={() => void events.refetch()}
              >
                Try again
              </button>
            </div>
          ) : events.data.items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.data.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <CalendarDays className="mx-auto mb-4 text-brand-600" size={32} />
              <h3 className="text-xl">Something great is on the way.</h3>
              <p className="mt-2 text-slate-500">
                No upcoming events yet. Check back soon or create one of your
                own.
              </p>
              <Link to={hostUrl} className="btn-primary mt-5">
                Start planning an event
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="container-page how-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">All the fun. Less of the fuss.</p>
            <h2>A good time, in three steps.</h2>
          </div>
        </div>
        <div className="how-grid">
          {[
            {
              n: "01",
              Icon: Search,
              title: "Find your thing",
              text: "Discover a new interest or go all in on something you already love.",
            },
            {
              n: "02",
              Icon: Ticket,
              title: "Make it a plan",
              text: "Choose your tickets and keep your booking details in one place.",
            },
            {
              n: "03",
              Icon: Sparkles,
              title: "Show up. Live a little.",
              text: "Bring your people, meet some new ones and make a day of it.",
            },
          ].map(({ n, Icon, title, text }) => (
            <div className="how-card" key={n}>
              <div>
                <Icon size={24} strokeWidth={1.5} />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container-page">
        <div className="host-banner">
          <div className="host-copy">
            <p className="eyebrow">Calling all community makers</p>
            <h2>
              Bring people together.
              <br />
              <span>Make something happen.</span>
            </h2>
            <p>
              From a small gathering to the next big thing. Create your event,
              manage your tickets and grow your audience.
            </p>
            <Link
              className="btn bg-white text-night hover:bg-orange-100 gap-3"
              to={hostUrl}
            >
              Let's make a plan <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="host-art" aria-hidden="true">
            <Ticket size={120} strokeWidth={0.8} />
            <span>
              YOUR EVENT.
              <br />
              THEIR NEXT
              <br />
              <em>great story.</em>
            </span>
            <Sparkles size={40} />
          </div>
        </div>
      </section>
    </>
  );
}
