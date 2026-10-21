export async function SendEmail({ name, toEmail, OTP }) {
  try {
    const callApi = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Arata',
          email: 'rizaaafridho@gmail.com',
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: 'Kode verifikasi akun Arata',
        htmlContent: `<div style='background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;'><table role='presentation' width='100%' style='max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;'><tr><td style='padding:32px;text-align:center;'><h1 style='margin:0 0 8px;font-size:24px;color:#0f766e;'>Arata</h1><p style='margin:0 0 24px;color:#6b7280;font-size:14px;'>Haloo ${name} Silahkan Verifikasi akun kamu</p><p style='margin:0 0 12px;color:#111827;font-size:15px;'>Masukkan kode berikut untuk menyelesaikan pendaftaran: ${OTP}
      </p><div style='display:inline-block;background:#f0fdfa;border:1px dashed #0f766e;border-radius:8px;padding:14px 28px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f766e;'>${OTP}</div><p style='margin:24px 0 0;color:#6b7280;font-size:13px;'>Kode berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p><p style='margin:16px 0 0;color:#9ca3af;font-size:12px;'>Kalau kamu tidak merasa mendaftar di Arata, abaikan email ini.</p></td></tr></table></div>`,
      }),
    });

    const stats = await callApi.json();

    return stats;
  } catch (error) {
    console.log(error);
  }
}
