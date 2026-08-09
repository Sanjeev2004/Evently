import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  MapPin,
  Menu,
  Search,
  Ticket,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, errorMessage } from "./api";
import { useAuth } from "./auth";
import type { ApiResponse, Booking, Event, Role, User } from "./types";
const money = (v: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v));
const date = (v: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(v));
function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links: Array<[string, string]> =
    user?.role === "ADMIN"
      ? [
          ["Dashboard", "/admin"],
          ["Events", "/admin/events"],
          ["Users", "/admin/users"],
          ["Bookings", "/admin/bookings"],
        ]
      : user?.role === "ORGANIZER"
        ? [
            ["Discover", "/events"],
            ["Overview", "/organizer"],
            ["My events", "/organizer/events"],
            ["Create event", "/organizer/events/new"],
            ["Bookings", "/bookings"],
          ]
        : [
            ["Discover", "/events"],
            ["My bookings", "/bookings"],
          ];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-extrabold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Ticket size={20} />
            </span>
            Evently
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(([n, p]) => (
              <NavLink
                key={p}
                to={p}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-ink"}`
                }
              >
                {n}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-slate-600"
                >
                  {user.name}
                </Link>
                <button className="btn-secondary" onClick={() => void logout()}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
              </>
            )}
          </div>
          <button
            className="md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="container-page space-y-2 border-t py-4 md:hidden">
            {links.map(([n, p]) => (
              <Link
                key={p}
                to={p}
                onClick={() => setOpen(false)}
                className="block py-2"
              >
                {n}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => void logout()}
                className="btn-secondary w-full"
              >
                Log out
              </button>
            ) : (
              <Link to="/login" className="btn-primary w-full">
                Log in
              </Link>
            )}
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t bg-white">
        <div className="container-page flex flex-col justify-between gap-3 py-8 text-sm text-slate-500 sm:flex-row">
          <span>© 2026 Evently. Built for memorable experiences.</span>
          <span>Secure booking · Trusted organizers</span>
        </div>
      </footer>
    </div>
  );
}
function Protected({
  roles,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return children;
}
const Loading = () => (
  <div className="container-page py-24 text-center text-slate-500">
    Loading…
  </div>
);
const Empty = ({ text }: { text: string }) => (
  <div className="card p-12 text-center text-slate-500">{text}</div>
);
const Status = ({ value }: { value: string }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-bold ${value === "PUBLISHED" || value === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : value.includes("CANCEL") || value === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
  >
    {value.replaceAll("_", " ")}
  </span>
);
function Home() {
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-slate-950 via-brand-700 to-blue-500 text-white">
        <div className="container-page grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
              Discover what’s happening near you
            </span>
            <h1 className="mt-5 text-5xl font-black leading-tight sm:text-6xl">
              Moments worth showing up for.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-blue-100">
              Concerts, workshops, sports and culture—find your next experience
              and book it securely in seconds.
            </p>
            <Link
              to="/events"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-brand-700"
            >
              Explore events
            </Link>
          </div>
          <div className="hidden grid-cols-2 gap-4 lg:grid">
            <div className="card mt-10 overflow-hidden">
              <img
                className="h-56 w-full object-cover"
                src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80"
                alt="Concert crowd"
              />
            </div>
            <div className="card overflow-hidden">
              <img
                className="h-56 w-full object-cover"
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80"
                alt="Festival"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="container-page py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [
              CalendarDays,
              "Curated experiences",
              "Browse upcoming events across cities and categories.",
            ],
            [
              Ticket,
              "Instant booking",
              "Real-time seat availability and secure confirmation.",
            ],
            [
              Users,
              "Trusted organizers",
              "Events reviewed before they go live.",
            ],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Ticket;
            return (
              <div className="card p-6" key={t as string}>
                <Icon className="text-brand-600" />
                <h2 className="mt-4 text-lg font-bold">{t as string}</h2>
                <p className="mt-2 text-sm text-slate-600">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
function EventCard({ event }: { event: Event }) {
  return (
    <article className="card group overflow-hidden">
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img
          src={
            event.imageUrl ||
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"
          }
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-700">
          {event.category}
        </span>
      </div>
      <div className="p-5">
        <h2 className="line-clamp-1 text-lg font-bold">{event.title}</h2>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays size={16} />
          {date(event.eventDate)} · {event.startTime}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={16} />
          {event.venue}, {event.city}
        </p>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">From</p>
            <p className="font-extrabold text-brand-700">
              {money(event.ticketPrice)}
            </p>
          </div>
          <Link className="btn-primary" to={`/events/${event.id}`}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
function Events() {
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(params);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", query],
    queryFn: () =>
      api
        .get<
          ApiResponse<{
            items: Event[];
            pagination: { page: number; pages: number; total: number };
          }>
        >("/events", { params: query })
        .then((r) => r.data.data),
  });
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    n.delete("page");
    setParams(n);
  };
  return (
    <div className="container-page py-10">
      <div>
        <h1 className="text-3xl font-black">Explore events</h1>
        <p className="mt-2 text-slate-600">
          Find an experience that fits your plans.
        </p>
      </div>
      <div className="card mt-7 grid gap-3 p-4 md:grid-cols-6">
        <label className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className="field pl-10"
            placeholder="Search events, venues…"
            value={params.get("search") ?? ""}
            onChange={(e) => set("search", e.target.value)}
          />
        </label>
        <input
          className="field"
          placeholder="City"
          value={params.get("city") ?? ""}
          onChange={(e) => set("city", e.target.value)}
        />
        <input
          className="field"
          placeholder="Category"
          value={params.get("category") ?? ""}
          onChange={(e) => set("category", e.target.value)}
        />
        <select
          className="field"
          value={params.get("sort") ?? "date"}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="date">Soonest</option>
          <option value="price">Price</option>
          <option value="popularity">Popular</option>
          <option value="createdAt">Newest</option>
        </select>
        <button className="btn-secondary" onClick={() => setParams({})}>
          Clear filters
        </button>
        <input
          type="date"
          aria-label="Date from"
          className="field"
          value={params.get("dateFrom") ?? ""}
          onChange={(e) => set("dateFrom", e.target.value)}
        />
        <input
          type="number"
          aria-label="Minimum price"
          className="field"
          placeholder="Min price"
          value={params.get("minPrice") ?? ""}
          onChange={(e) => set("minPrice", e.target.value)}
        />
        <input
          type="number"
          aria-label="Maximum price"
          className="field"
          placeholder="Max price"
          value={params.get("maxPrice") ?? ""}
          onChange={(e) => set("maxPrice", e.target.value)}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <Empty text="Events could not be loaded." />
      ) : !data?.items.length ? (
        <div className="mt-8">
          <Empty text="No events match these filters." />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((e) => (
              <EventCard event={e} key={e.id} />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              className="btn-secondary"
              disabled={data.pagination.page <= 1}
              onClick={() => set("page", String(data.pagination.page - 1))}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            <button
              className="btn-secondary"
              disabled={data.pagination.page >= data.pagination.pages}
              onClick={() => set("page", String(data.pagination.page + 1))}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const qc = useQueryClient();
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () =>
      api.get<ApiResponse<Event>>(`/events/${id}`).then((r) => r.data.data),
  });
  const book = useMutation({
    mutationFn: () => api.post("/bookings", { eventId: id, quantity: qty }),
    onSuccess: () => {
      toast.success("Booking confirmed!");
      void qc.invalidateQueries({ queryKey: ["event", id] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (isLoading) return <Loading />;
  if (!event) return <Empty text="Event not found" />;
  const disabled =
    !user ||
    event.availableSeats < 1 ||
    event.status !== "PUBLISHED" ||
    new Date(event.eventDate) <= new Date();
  return (
    <div className="container-page py-10">
      <div className="overflow-hidden rounded-3xl bg-slate-200">
        <img
          className="h-72 w-full object-cover md:h-96"
          src={
            event.imageUrl ||
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80"
          }
          alt=""
        />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <article>
          <div className="flex gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
              {event.category}
            </span>
            <Status value={event.status} />
          </div>
          <h1 className="mt-4 text-4xl font-black">{event.title}</h1>
          <div className="mt-6 grid gap-3 text-slate-600 sm:grid-cols-2">
            <p className="flex gap-2">
              <CalendarDays /> {date(event.eventDate)}, {event.startTime}–
              {event.endTime}
            </p>
            <p className="flex gap-2">
              <MapPin /> {event.venue}, {event.city}
            </p>
          </div>
          <h2 className="mt-10 text-xl font-bold">About this event</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
            {event.description}
          </p>
          <p className="mt-8 text-sm text-slate-500">
            Organized by <b>{event.organizer?.name}</b>
          </p>
        </article>
        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <p className="text-sm text-slate-500">Price per ticket</p>
          <p className="mt-1 text-3xl font-black">{money(event.ticketPrice)}</p>
          <p className="mt-2 text-sm text-slate-500">
            {event.availableSeats} seats remaining
          </p>
          <label className="label mt-6">Quantity</label>
          <select
            className="field"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          >
            {Array.from(
              { length: Math.min(10, event.availableSeats) },
              (_, i) => (
                <option key={i + 1}>{i + 1}</option>
              ),
            )}
          </select>
          <div className="my-5 flex justify-between border-y py-4">
            <span>Total</span>
            <b>{money(Number(event.ticketPrice) * qty)}</b>
          </div>
          <button
            className="btn-primary w-full"
            disabled={disabled || book.isPending}
            onClick={() => book.mutate()}
          >
            {!user
              ? "Log in to book"
              : event.availableSeats < 1
                ? "Sold out"
                : book.isPending
                  ? "Booking…"
                  : "Book now"}
          </button>
        </aside>
      </div>
    </div>
  );
}
function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const form = useForm<{
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER";
  }>({ defaultValues: { name: "", email: "", password: "", role: "USER" } });
  const submit = async (values: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER";
  }) => {
    setError("");
    const schema = z.object({
      name: register ? z.string().trim().min(2, "Name is required") : z.string(),
      email: z.string().email("Enter a valid email"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(["USER", "ORGANIZER"]),
    });
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    try {
      if (register)
        await auth.register({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          role: parsed.data.role,
        });
      else await auth.login(parsed.data.email, parsed.data.password);
      nav("/");
    } catch (x) {
      setError(errorMessage(x));
    }
  };
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <form
        onSubmit={form.handleSubmit((values) => void submit(values))}
        className="card w-full max-w-md p-7"
      >
        <h1 className="text-2xl font-black">
          {register ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {register
            ? "Start discovering memorable events."
            : "Log in to manage your events and bookings."}
        </p>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 space-y-4">
          {register && (
            <>
              <label>
                <span className="label">Full name</span>
                <input className="field" {...form.register("name")} />
              </label>
              <label>
                <span className="label">Account type</span>
                <select className="field" {...form.register("role")}>
                  <option value="USER">Attendee</option>
                  <option value="ORGANIZER">Event organizer</option>
                </select>
              </label>
            </>
          )}
          <label>
            <span className="label">Email</span>
            <input type="email" className="field" {...form.register("email")} />
          </label>
          <label>
            <span className="label">Password</span>
            <input
              type="password"
              className="field"
              {...form.register("password")}
            />
          </label>
          <button className="btn-primary w-full">
            {register ? "Create account" : "Log in"}
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-500">
          {register ? "Already registered?" : "New to Evently?"}{" "}
          <Link
            className="font-bold text-brand-600"
            to={register ? "/login" : "/register"}
          >
            {register ? "Log in" : "Create account"}
          </Link>
        </p>
      </form>
    </div>
  );
}
function Profile() {
  const { user } = useAuth();
  return (
    <Page title="My profile" subtitle="Your account information">
      <div className="card max-w-xl divide-y p-6">
        {[
          ["Name", user!.name],
          ["Email", user!.email],
          ["Role", user!.role],
          ["Status", user!.isBlocked ? "Blocked" : "Active"],
        ].map(([k, v]) => (
          <div className="flex justify-between py-4" key={k}>
            <span className="text-slate-500">{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
    </Page>
  );
}
function MyBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () =>
      api.get<ApiResponse<Booking[]>>("/bookings/my").then((r) => r.data.data),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/cancel`),
    onSuccess: () => {
      toast.success("Booking cancelled");
      void qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Page title="My bookings" subtitle="Your tickets and booking history">
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty text="You have no bookings yet." />
      ) : (
        <div className="space-y-4">
          {data.map((b) => (
            <div
              className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
              key={b.id}
            >
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Ticket />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{b.event.title}</h2>
                  <Status value={b.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {b.bookingReference} · {b.quantity} ticket(s) ·{" "}
                  {money(b.totalAmount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {date(b.event.eventDate)} · {b.event.city}
                </p>
              </div>
              <Link className="btn-secondary" to={`/bookings/${b.id}`}>
                View ticket
              </Link>
              {b.status === "CONFIRMED" && (
                <button
                  className="btn-secondary text-red-600"
                  onClick={() =>
                    confirm("Cancel this booking?") && cancel.mutate(b.id)
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
function BookingDetails() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () =>
      api
        .get<ApiResponse<Booking>>(`/bookings/${id}`)
        .then((response) => response.data.data),
  });
  if (isLoading) return <Loading />;
  if (!data) return <Empty text="Booking not found." />;
  return (
    <Page title="Booking details" subtitle="Your booking confirmation and ticket summary">
      <div className="card max-w-2xl p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Booking reference</p>
            <p className="mt-1 font-mono text-xl font-bold">{data.bookingReference}</p>
          </div>
          <Status value={data.status} />
        </div>
        <h2 className="mt-6 text-2xl font-black">{data.event.title}</h2>
        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <p><span className="block text-slate-500">Date</span><b>{date(data.event.eventDate)}</b></p>
          <p><span className="block text-slate-500">Venue</span><b>{data.event.venue}, {data.event.city}</b></p>
          <p><span className="block text-slate-500">Tickets</span><b>{data.quantity}</b></p>
          <p><span className="block text-slate-500">Total paid</span><b>{money(data.totalAmount)}</b></p>
        </div>
      </div>
    </Page>
  );
}
function Page({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{title}</h1>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
function StatGrid({ stats }: { stats: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(stats).map(([k, v]) => (
        <div className="card p-6" key={k}>
          <p className="text-sm capitalize text-slate-500">
            {k.replace(/([A-Z])/g, " $1")}
          </p>
          <p className="mt-2 text-3xl font-black">
            {k.toLowerCase().includes("revenue")
              ? money(v as number)
              : String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}
function OrganizerDashboard() {
  const { data } = useQuery({
    queryKey: ["org-stats"],
    queryFn: () =>
      api
        .get<ApiResponse<Record<string, unknown>>>("/organizer/stats")
        .then((r) => r.data.data),
  });
  return (
    <Page
      title="Organizer overview"
      subtitle="A snapshot of your event business"
    >
      <StatGrid stats={data ?? {}} />
    </Page>
  );
}
function OrganizerEvents() {
  const { data, isLoading } = useQuery({
    queryKey: ["org-events"],
    queryFn: () =>
      api
        .get<ApiResponse<Event[]>>("/organizer/events")
        .then((r) => r.data.data),
  });
  const qc = useQueryClient();
  const act = async (id: string, action: "submit" | "cancel") => {
    try {
      await api.patch(`/events/${id}/${action}`);
      toast.success(
        action === "submit" ? "Submitted for approval" : "Event cancelled",
      );
      void qc.invalidateQueries({ queryKey: ["org-events"] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Page
      title="My events"
      subtitle="Create, submit and manage your events"
      action={
        <Link className="btn-primary" to="/organizer/events/new">
          Create event
        </Link>
      }
    >
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty text="Create your first event to get started." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Event", "Date", "Seats", "Status", "Actions"].map((x) => (
                  <th className="p-4" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr className="border-t" key={e.id}>
                  <td className="p-4 font-bold">{e.title}</td>
                  <td className="p-4">{date(e.eventDate)}</td>
                  <td className="p-4">
                    {e.availableSeats}/{e.totalSeats}
                  </td>
                  <td className="p-4">
                    <Status value={e.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        className="text-brand-600"
                        to={`/organizer/events/${e.id}/edit`}
                      >
                        Edit
                      </Link>
                      {["DRAFT", "REJECTED"].includes(e.status) && (
                        <button
                          className="text-brand-600"
                          onClick={() => void act(e.id, "submit")}
                        >
                          Submit
                        </button>
                      )}
                      {!["CANCELLED", "COMPLETED"].includes(e.status) && (
                        <button
                          className="text-red-600"
                          onClick={() => void act(e.id, "cancel")}
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        className="text-brand-600"
                        to={`/organizer/events/${e.id}/bookings`}
                      >
                        Bookings
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
function EventForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["event-edit", id],
    enabled: !!id,
    queryFn: () =>
      api.get<ApiResponse<Event>>(`/events/${id}`).then((r) => r.data.data),
  });
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (id) await api.patch(`/events/${id}`, f);
      else await api.post("/events", f);
      toast.success(id ? "Event updated" : "Event created");
      nav("/organizer/events");
    } catch (x) {
      toast.error(errorMessage(x));
    }
  };
  const fields = [
    ["title", "Title", "text"],
    ["category", "Category", "text"],
    ["venue", "Venue", "text"],
    ["city", "City", "text"],
    ["eventDate", "Event date", "date"],
    ["startTime", "Start time", "time"],
    ["endTime", "End time", "time"],
    ["ticketPrice", "Ticket price", "number"],
    ["totalSeats", "Total seats", "number"],
    ["imageUrl", "Image URL", "url"],
  ];
  return (
    <Page
      title={id ? "Edit event" : "Create event"}
      subtitle="Complete the details, then submit it for admin approval"
    >
      <form
        onSubmit={(e) => void submit(e)}
        className="card grid max-w-3xl gap-5 p-6 sm:grid-cols-2"
      >
        {fields.map(([name, label, type]) => (
          <label key={name}>
            <span className="label">{label}</span>
            <input
              className="field"
              name={name}
              type={type}
              min={type === "number" ? "0" : undefined}
              required={name !== "imageUrl"}
              defaultValue={
                name === "eventDate" && data?.eventDate
                  ? data.eventDate.slice(0, 10)
                  : String(data?.[name as keyof Event] ?? "")
              }
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="label">Description</span>
          <textarea
            className="field min-h-36"
            name="description"
            minLength={20}
            required
            defaultValue={data?.description}
          />
        </label>
        <div className="sm:col-span-2 flex justify-end gap-3">
          <Link className="btn-secondary" to="/organizer/events">
            Cancel
          </Link>
          <button className="btn-primary">Save event</button>
        </div>
      </form>
    </Page>
  );
}
function EventBookings() {
  const { eventId } = useParams();
  const { data } = useQuery({
    queryKey: ["event-bookings", eventId],
    queryFn: () =>
      api
        .get<
          ApiResponse<
            Array<{
              id: string;
              bookingReference: string;
              quantity: number;
              totalAmount: string;
              status: string;
              user: { name: string; email: string };
            }>
          >
        >(`/organizer/events/${eventId}/bookings`)
        .then((r) => r.data.data),
  });
  return (
    <Page title="Event bookings" subtitle="Attendees and ticket sales">
      {!data?.length ? (
        <Empty text="No bookings for this event." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Reference", "Attendee", "Tickets", "Amount", "Status"].map(
                  (x) => (
                    <th className="p-4" key={x}>
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr className="border-t" key={b.id}>
                  <td className="p-4 font-mono">{b.bookingReference}</td>
                  <td className="p-4">
                    {b.user.name}
                    <small className="block text-slate-500">
                      {b.user.email}
                    </small>
                  </td>
                  <td className="p-4">{b.quantity}</td>
                  <td className="p-4">{money(b.totalAmount)}</td>
                  <td className="p-4">
                    <Status value={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      api
        .get<ApiResponse<Record<string, unknown>>>("/admin/stats")
        .then((r) => r.data.data),
  });
  return (
    <Page
      title="Platform dashboard"
      subtitle="Operational health and marketplace activity"
    >
      <StatGrid stats={data ?? {}} />
    </Page>
  );
}
function AdminEvents() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () =>
      api.get<ApiResponse<Event[]>>("/admin/events").then((r) => r.data.data),
  });
  const action = async (id: string, a: "approve" | "reject" | "cancel") => {
    try {
      await api.patch(
        `/admin/events/${id}/${a}`,
        a === "reject" ? {} : undefined,
      );
      toast.success(`Event ${a}d`);
      void qc.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Page title="All events" subtitle="Review and moderate platform listings">
      {!data?.length ? (
        <Empty text="No events found." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Event", "Organizer", "Date", "Status", "Actions"].map(
                  (x) => (
                    <th className="p-4" key={x}>
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr className="border-t" key={e.id}>
                  <td className="p-4 font-bold">{e.title}</td>
                  <td className="p-4">{e.organizer?.name}</td>
                  <td className="p-4">{date(e.eventDate)}</td>
                  <td className="p-4">
                    <Status value={e.status} />
                  </td>
                  <td className="p-4 space-x-3">
                    {e.status === "PENDING_APPROVAL" && (
                      <>
                        <button
                          className="text-emerald-600"
                          onClick={() => void action(e.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => void action(e.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}{" "}
                    {!["CANCELLED", "COMPLETED"].includes(e.status) && (
                      <button
                        className="text-red-600"
                        onClick={() => void action(e.id, "cancel")}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
function AdminUsers() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () =>
      api.get<ApiResponse<User[]>>("/admin/users").then((r) => r.data.data),
  });
  const block = async (u: User) => {
    await api.patch(`/admin/users/${u.id}/block`, { isBlocked: !u.isBlocked });
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success("User status updated");
  };
  return (
    <Page title="Users" subtitle="Manage access across the platform">
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {["Name", "Email", "Role", "Status", "Action"].map((x) => (
                <th className="p-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr className="border-t" key={u.id}>
                <td className="p-4 font-bold">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.role}</td>
                <td className="p-4">{u.isBlocked ? "Blocked" : "Active"}</td>
                <td className="p-4">
                  <button
                    className="text-brand-600"
                    onClick={() => void block(u)}
                  >
                    {u.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
function AdminBookings() {
  const { data } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () =>
      api
        .get<
          ApiResponse<
            Array<{
              id: string;
              bookingReference: string;
              quantity: number;
              totalAmount: string;
              status: string;
              user: { name: string };
              event: { title: string };
            }>
          >
        >("/admin/bookings")
        .then((r) => r.data.data),
  });
  return (
    <Page title="All bookings" subtitle="Platform-wide transaction history">
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Reference",
                "User",
                "Event",
                "Tickets",
                "Amount",
                "Status",
              ].map((x) => (
                <th className="p-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((b) => (
              <tr className="border-t" key={b.id}>
                <td className="p-4 font-mono">{b.bookingReference}</td>
                <td className="p-4">{b.user.name}</td>
                <td className="p-4">{b.event.title}</td>
                <td className="p-4">{b.quantity}</td>
                <td className="p-4">{money(b.totalAmount)}</td>
                <td className="p-4">
                  <Status value={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
function Message({
  code,
  title,
  text,
}: {
  code: string;
  title: string;
  text: string;
}) {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-7xl font-black text-brand-100">{code}</p>
        <h1 className="mt-3 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-slate-500">{text}</p>
        <Link className="btn-primary mt-6" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/bookings"
          element={
            <Protected>
              <MyBookings />
            </Protected>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <Protected>
              <BookingDetails />
            </Protected>
          }
        />
        <Route
          path="/organizer"
          element={
            <Protected roles={["ORGANIZER"]}>
              <OrganizerDashboard />
            </Protected>
          }
        />
        <Route
          path="/organizer/events"
          element={
            <Protected roles={["ORGANIZER"]}>
              <OrganizerEvents />
            </Protected>
          }
        />
        <Route
          path="/organizer/events/new"
          element={
            <Protected roles={["ORGANIZER"]}>
              <EventForm />
            </Protected>
          }
        />
        <Route
          path="/organizer/events/:id/edit"
          element={
            <Protected roles={["ORGANIZER"]}>
              <EventForm />
            </Protected>
          }
        />
        <Route
          path="/organizer/events/:eventId/bookings"
          element={
            <Protected roles={["ORGANIZER"]}>
              <EventBookings />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected roles={["ADMIN"]}>
              <AdminDashboard />
            </Protected>
          }
        />
        <Route
          path="/admin/events"
          element={
            <Protected roles={["ADMIN"]}>
              <AdminEvents />
            </Protected>
          }
        />
        <Route
          path="/admin/users"
          element={
            <Protected roles={["ADMIN"]}>
              <AdminUsers />
            </Protected>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <Protected roles={["ADMIN"]}>
              <AdminBookings />
            </Protected>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <Message
              code="403"
              title="Access denied"
              text="Your account does not have permission to view this page."
            />
          }
        />
        <Route
          path="*"
          element={
            <Message
              code="404"
              title="Page not found"
              text="The page you’re looking for does not exist."
            />
          }
        />
      </Routes>
    </Layout>
  );
}
