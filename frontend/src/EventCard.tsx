import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, MapPin, Ticket } from "lucide-react";
import type { Event } from "./types";
const money = (v: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v));
export function EventCard({ event }: { event: Event }) {
  const [imageFailed, setImageFailed] = useState(false);
  const when = new Date(event.eventDate);
  const fullDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
  }).format(when);
  return (
    <article className="event-card group">
      <Link
        to={`/events/${event.id}`}
        className="event-card-photo"
        aria-label={`View ${event.title}`}
      >
        {imageFailed ? (
          <div className="event-image-placeholder">
            <Ticket size={48} strokeWidth={1} />
            <span>{event.category}</span>
          </div>
        ) : (
          <img
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={
              event.imageUrl ||
              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"
            }
            alt=""
          />
        )}
        <span className="event-category">{event.category}</span>
        <time
          className="event-date-badge"
          dateTime={event.eventDate}
          aria-label={fullDate}
        >
          <span>{when.toLocaleDateString("en-IN", { month: "short" })}</span>
          <strong>{when.getDate()}</strong>
        </time>
        {event.availableSeats === 0 && (
          <span className="sold-out-tag">Sold out</span>
        )}
      </Link>
      <div className="event-card-body">
        <p className="event-time">
          <Clock3 size={13} />
          {when.toLocaleDateString("en-IN", { weekday: "long" })}
          <span aria-hidden="true">&middot;</span>
          {event.startTime}
        </p>
        <h3>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="event-location">
          <MapPin size={15} />
          <span>
            {event.venue}, {event.city}
          </span>
        </p>
        <div className="event-card-bottom">
          <div>
            <span className="event-price">
              {Number(event.ticketPrice) === 0
                ? "Free"
                : money(event.ticketPrice)}
            </span>
            <span className="event-price-unit"> / person</span>
            <p className="event-availability">
              {event.availableSeats === 0
                ? "No tickets remaining"
                : `${event.availableSeats} tickets available`}
            </p>
          </div>
          <Link
            className="event-card-arrow"
            to={`/events/${event.id}`}
            aria-label={`View details for ${event.title}`}
          >
            <ArrowUpRight size={22} />
          </Link>
        </div>
      </div>
    </article>
  );
}
