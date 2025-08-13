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

    console.log("OAuth successful for user:", tokenData.athlete.firstname, tokenData.athlete.lastname);

    // Redirect to Flutter app (deep link)
    res.redirect(`myapp://login_success?token=${tokenData.access_token}`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OAuth failed" });
  }
}