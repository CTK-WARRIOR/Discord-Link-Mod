const http = require('http');
const express = require('express');
const db = require("quick.db")
const cookieParser = require("cookie-parser")
const app = express();
const fetch = require("node-fetch")
const server = http.createServer(app);
const io = require('socket.io')(server);
const url = require("url");
const {sid, eid, sn, en, sa, ea} = process.env

app.use(express.static('frontend', {
  extensions: ['html']
}));
app.use(cookieParser());

io.on("connection", (socket) => {
	socket.on("getData", (data) => {
		if (!data.id) return;
		socket.emit("userData", db.get(data.id))
	})
	socket.on("urlCreateReq", (data) => {
		console.log("--------------------------")
		console.log("Vanity requested: ")
		console.log(data)
   let check = db.has(`v_${data.vanity}`)
		if (check) {
			socket.emit("urlReqResp", {
				response: "There's already a vanity link created with this invite"
			})
		} else {
			db.set(`v_${data.vanity}`, data.srvrlink)
			socket.emit("urlReqResp", {
				response: "Added the hucking link."
			})
		}
	})
})

app.get("/", (request, response) => {

  console.log(`Ping Received.`);
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.redirect("/login")
});

app.get("/i/:name", (req, res) => {
  let name = req.params.name;
  if(!name) return res.redirect("/login");
  let database = db.get(`v_${name}`);
  if(!database) return res.redirect("/login");
	console.log("--------------------------")
	console.log(`Vanity '${name}' used!`);
	res.redirect(`https://discord.gg/${database}`)
})


app.get("/auth", (request, response) => {
	//authentication stuff
	const queries = url.parse(request.url, true);
	if (!queries.query.code) return;
	const code = queries.query.code;
	const data = {
		client_id: process.env.DISCORD_CLIENT_ID,
		client_secret: process.env.DISCORD_CLIENT_SECRET,	
		grant_type: "authorization_code",
		code: code,
		redirect_uri:process.env.DISCORD_REDIRECT_URI,
		scope: "identify"
	}

	fetch("https://discord.com/api/oauth2/token", {
		method: 'POST',
		body: new URLSearchParams(data),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	})
	.then(res => res.json())
	.then(result => {
		fetch("https://discord.com/api/users/@me", {
			headers: {
				authorization: `${result.token_type} ${result.access_token}`
			}
		})
		.then(res => res.json())
		.then(result => { // result response below
			const key = getKey(result.id, result.avatar, result.username);
			db.set(key, {id: result.id, name: result.username, avatar: result.avatar, discrim: result.discriminator})
			response.cookie('id', key, {path: '/', secure: true })
			response.redirect("/index.html")
		})
	})
})

function getKey(id, avatar, username) {
	return `${id.toString().substring(sid, eid)}${username.substring(sn, en)}${avatar.toString().substring(sa, ea)}`
}

/* 
result response
{
  id: '738362958253522976',
  username: 'aNotsoSilentJungle399',
  avatar: 'a_5d70e491b310ffc65e3f4c5f5a39d647',
  discriminator: '6969',
  public_flags: 128,
  flags: 128,
  locale: 'en-US',
  mfa_enabled: true,
  premium_type: 1
}
*/

const listener = server.listen(process.env.PORT, function() {
  console.log(`Your app is listening on port ` + listener.address().port);
});