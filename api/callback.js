export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(200).json({ message: "MyApp API - Ready" });
  }

  try {
    console.log("Root callback received code:", code);

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
    console.log("Token received, redirecting to app");

    res.redirect(`myapp://login_success?token=${tokenData.access_token}`);

  } catch (err) {
    console.error("Root callback error:", err);
    res.status(500).json({ error: "OAuth failed" });
  }
}