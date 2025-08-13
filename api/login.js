export default function handler(req, res) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI; // Remove the /api/callback part
  const scope = "read,activity:read_all";

  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

  res.redirect(authUrl);
}