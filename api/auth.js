// /api/auth/strava_login.js
export default function handler(req, res) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL}/api/auth/strava_callback`;
  const scope = "read,activity:read_all"; // Scope for workouts

  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

  res.redirect(authUrl);
}