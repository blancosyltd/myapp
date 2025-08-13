// /api/auth/strava_callback.js
import fetch from 'node-fetch';
import { saveUser } from '../../db/queries.js';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();

    // Save to SQL
    await saveUser({
      strava_id: tokenData.athlete.id,
      firstname: tokenData.athlete.firstname,
      lastname: tokenData.athlete.lastname,
      profile_pic: tokenData.athlete.profile,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires: new Date(Date.now() + tokenData.expires_in * 1000)
    });

    // Redirect to Flutter app (deep link)
    res.redirect(`myapp://login_success?token=${tokenData.access_token}`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OAuth failed" });
  }
}