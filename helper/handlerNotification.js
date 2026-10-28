import { Notification } from '../models/model_notification.js';

export async function NotificationDateTour({ value, userBooking = [] }) {
  const { nameTour } = value;

  const formatNotif = userBooking?.map((el) => ({
    booking: el._id,
    user: el.user,
    message: `Tanggal Keberangkatan Tour Dan Pemandu Di Perbarui , Untuk Tour ${nameTour} yang kamu Booking ,Pastikan Rombongan Anda Termasuk Anda Dengan Total ${el.quantity} Dikabari Juga, Silahkan Lihat Detail Lengkapnya`,
    notifTrip: true,
  }));

  return await Notification.insertMany(formatNotif);
}

export async function Notification_Trip_Finish({ value, userBooking = [] }) {
  const { name } = value || {};

  const formatNotif = userBooking?.map((el) => ({
    booking: el._id,
    user: el.user,
    message: `Terimakasih Sudah Mempercayakan Kami Untuk Kebutuhan Liburan Anda , Tour Dengan Nama ${name} , Sudah Selesai Pada Tanggal `,
    typeNotif: 'trip',
  }));

  return await Notification.insertMany(formatNotif);
}

export async function Notification_Trip_OneLocationFinish({
  value,
  userBooking = [],
}) {
  const { description } = value || {};

  const formatNotif = userBooking?.map((el) => ({
    booking: el._id,
    user: el.user,
    message: ` Lokasi Wisata Dengan Nama ${description} Sudah Selesai , Pada Tanggal `,
    typeNotif: 'trip',
  }));

  return await Notification.insertMany(formatNotif);
}
