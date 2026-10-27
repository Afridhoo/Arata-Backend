import { Booking } from '../models/model_booking.js';

export async function GetUserBookingUseFields({ fields }) {
  return await Booking.find({ fields });
}
