export default function DateNow() {
  const sekarang = new Date();

  const opsiWaktu = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Menggunakan format 24 jam
  };

  const waktuIndonesia = sekarang.toLocaleString('id-ID', opsiWaktu);
  return waktuIndonesia;
}
