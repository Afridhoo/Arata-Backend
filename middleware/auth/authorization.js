import catchAsync from "../../helper/catchAsync.js";
import errorApp from "../../helper/errorQuery.js";
import { checkTokenIsValid } from "../../helper/tokenHelper.js";

export const accsess = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role))
      return next(new errorApp('Tidak Bisa Mengakses URL ini'), 400);

    next();
  };
};


export const protect = catchAsync(async (req, res, next) => {
  const authorization = await checkTokenIsValid(req.cookies.jwt);

  const { user, token, decod } = authorization;

  if (!token) return next(new errorApp('Log in first to access.', 401));
  if (!user) return next(new errorApp('account does not exist.', 400));

  const changePassword = user?.changedPasswordAfter(decod.iat);
  if (changePassword) {
    return next(new errorApp('The account password has been changed.', 401));
  }

  req.user = user;
  next();
});
