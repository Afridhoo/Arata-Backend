import { Booking } from '../models/model_booking.js';

export async function GetUserBookingUseFields({ filter }) {
  return await Booking.find(filter);
}
