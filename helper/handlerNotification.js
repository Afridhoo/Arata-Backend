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

export async function Notification_CancelBooking_User({
  idBooking,
  idUserHit,
  bookingDate,
  name,
  quantity,
}) {
  const formatNotif = {
    booking: idBooking,
    user: idUserHit,
    message: `Pesanan Tour Anda Yang Di Pesan Pada Tanggal ${bookingDate} Dengan Nama ${name} Dengan Jumlah Pesanan ${quantity} Berhasil Anda Batalkan Pada Tanggal `,
  };

  return await Notification.create(formatNotif);
}

export async function Notification_ConfirmedBooking({
  bookingId,
  userId,
  bookingDate,
  payment,
  name,
  quantity,
}) {
  const formatNotif = {
    booking: bookingId,
    user: userId,
    message: `Booking Yang Di Pesan Pada Tanggal ${bookingDate} Dengan Nama Tour ${name} Pembayaran ${payment}, Sudah Di Konfirmasi , Dengan Total Pesanan ${quantity} Orang `,
  };

  return Notification.create(formatNotif);
}
