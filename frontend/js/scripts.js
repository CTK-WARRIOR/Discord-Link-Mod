const socket = io()

Vue.component("userdata", {
	template: `
		<div class="userdata">
			<table cellspacing="0" cellpadding="0">
				<tr>
					<td><span class="username">{{ username }}</span></td>
					<td rowspan=2><img :src="userpfplink" class="userpfp"></img></td>
				</tr><tr>
					<td><span class="userdiscrim">#{{ userdiscrim }}</span></td>
				</tr>
			</table>
		</div>
		`,
	props: {
		username: {
			required: true,
		},
		userid: {
			required: true,
		},
		userpfp: {
			required: true,
		},
		userdiscrim: {
			required: true,
		}
	},
		computed: {
			userpfplink() {
				return `https://cdn.discordapp.com/avatars/${this.userid}/${this.userpfp}.png`
			}
		}
})

socket.emit("getData", {id: $cookies.get("id")})
socket.on("userData", function(data) {
	app.username = data.name
	app.userid = data.id
	app.userpfp = data.avatar
	app.userdiscrim = data.discrim
})

const app = new Vue({
	el: "#app",
	data: {
		username: null,
		userid: null,
		userpfp: null,
		userdiscrim: null,
		srvrlink: null,
		vanity: null,
		alert: false,
		retalert: null,
	},
	methods: {
		createURL() {
			const comp = this;
			if (!this.srvrlink || !this.vanity) {
					this.alert = true;
					this.retalert = "Enter both fields bruh!";
					setTimeout(function() {comp.alert = false}, 3000)
					return
				
			} else {	
				if (this.srvrlink.includes("/")) {
					const spl = this.srvrlink.split("/");
					const srvrlink = spl[spl.length -1];
					socket.emit("urlCreateReq", {
						srvrlink: srvrlink,
						vanity: this.vanity,
					})
				} else {
					const srvrlink = this.srvrlink;
					socket.emit("urlCreateReq", {
						srvrlink: srvrlink,
						vanity: this.vanity,
					})
					socket.on("urlReqResp", function(data) {
						comp.alert = true;
						comp.retalert = data.response;
						setTimeout(function() {comp.alert = false}, 3000)
					})
				}
			}
		}
	}
})
