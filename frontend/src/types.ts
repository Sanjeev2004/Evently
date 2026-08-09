export type Role='USER'|'ORGANIZER'|'ADMIN';export type EventStatus='DRAFT'|'PENDING_APPROVAL'|'PUBLISHED'|'REJECTED'|'CANCELLED'|'COMPLETED';
export interface User{id:string;name:string;email:string;role:Role;isBlocked:boolean;createdAt:string}
export interface Event{id:string;title:string;description:string;category:string;venue:string;city:string;eventDate:string;startTime:string;endTime:string;ticketPrice:string;totalSeats:number;availableSeats:number;imageUrl?:string;organizerId:string;status:EventStatus;organizer?:{id:string;name:string};_count?:{bookings:number}}
export interface Booking{id:string;quantity:number;totalAmount:string;status:'CONFIRMED'|'CANCELLED'|'REFUNDED';bookingReference:string;bookedAt:string;event:Event}
export interface ApiResponse<T>{success:boolean;message:string;data:T}

