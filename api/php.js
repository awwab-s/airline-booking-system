// The one and only serverless function (Vercel's free Hobby plan allows at most 12).
// vercel.json sends every /php/NAME.php request here as /api/php?__page=NAME and this file
// hands it to the matching ported page in api/_pages/ (explicit list so Vercel bundles them all).
const pages = {
  adminaddflight: require('./_pages/adminaddflight'),
  admindeleteflight: require('./_pages/admindeleteflight'),
  adminsignin: require('./_pages/adminsignin'),
  adminupdateflight: require('./_pages/adminupdateflight'),
  adminupdateflight2: require('./_pages/adminupdateflight2'),
  adminviewbookings: require('./_pages/adminviewbookings'),
  adminviewflights: require('./_pages/adminviewflights'),
  bookflight: require('./_pages/bookflight'),
  flights: require('./_pages/flights'),
  passengerinfo: require('./_pages/passengerinfo'),
  payment: require('./_pages/payment'),
  processpayment: require('./_pages/processpayment'),
  searchflight: require('./_pages/searchflight'),
  ticket: require('./_pages/ticket'),
};

module.exports = (req, res) => {
  const page = (req.query || {}).__page;
  if (!Object.prototype.hasOwnProperty.call(pages, page)) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  return pages[page](req, res);
};
