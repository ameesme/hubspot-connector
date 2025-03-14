import express from "express";

const allowedOrigins = [
  "https://donate.sheltersuit.com",
  "https://payments.sheltersuit.com",
  "http://localhost:3000",
];

function Origins(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
}

export default Origins;
