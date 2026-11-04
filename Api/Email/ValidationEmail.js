export function checkIsLimitSendOtp(numCount) {
  if (numCount >= 5) return true;
  return false;
}

export function checkIsLimitSendemail(numCount) {
  if (numCount >= 3) return true;
  return false;
}

export function checkIsOtpAlreadyNotExpired(dateExpiredOtp) {
  if (dateExpiredOtp >= Date.now()) return true;
  return false;
}

export function checkisOTPExpired(otpExpired) {
  if (!otpExpired) return true;
  if (Date.now() >= otpExpired) return true;

  return false;
}

export function createTokenOTP() {
  const OTP = crypto.randomInt(100000, 1000000);
}

export function checkOtpValid(candidateOTP, OTPValid) {
  return Number(candidateOTP) === Number(OTPValid);
}
