// credits - made by Tyler and coached by Tzech

const autoRelaunchDelay = 100; // Seconds
const launchDelay = 100; // also seconds

console.log("bot v1.6");

const child = require("child_process");
const fs = require("fs");
const https = require("https");
let hasScreenshotDesktop = false;
try {
	require.resolve("screenshot-desktop");
	hasScreenshotDesktop = true;
} catch (e) {
	console.log("screenshot-desktop not found. Installing...");
	child.execSync("npm install screenshot-desktop");
}
let hasPM2 = false;
try {
	require.resolve("pm2");
	hasPM2 = true;
} catch (e) {
	console.log("pm2 not found. Installing...");
	child.execSync("npm install pm2");
}
const filesToDownload = [
	{ url: "https://cdn.discordapp.com/attachments/1079876075905105980/1080939366362390579/Rmulti.exe", fileName: "./extra/Rmulti.exe" },
	{ url: "https://cdn.discordapp.com/attachments/1079876075905105980/1080939384095912036/nircmd.exe", fileName: "./extra/nircmd.exe" },
	{ url: "https://cdn.discordapp.com/attachments/1079876075905105980/1080939341456609300/robuxAmountl.js", fileName: "./js/robuxAmountl.js" },
	{ url: "https://cdn.discordapp.com/attachments/1079876075905105980/1080961186251669615/startBot.bat", fileName: "./startBot.bat" },
	{ url: "https://cdn.discordapp.com/attachments/1079876075905105980/1080961215917998230/stopBot.bat", fileName: "./stopBot.bat" },
];
let hasRmulti = false;
let hasNircmd = false;
let hasRobuxAmountl = false;
let hasstartBot = false;
let hasstopBot = false;
for (const file of filesToDownload) {
	const filePath = file.fileName;
	if (!fs.existsSync(filePath)) {
		const fileStream = fs.createWriteStream(filePath);
		https.get(file.url, (response) => {
			response.pipe(fileStream);
		});
	} else {
		if (file.fileName === "./extra/Rmulti.exe") {
			hasRmulti = true;
		} else if (file.fileName === "./extra/nircmd.exe") {
			hasNircmd = true;
		} else if (file.fileName === "./js/robuxAmountl.js") {
			hasRobuxAmountl = true;
		} else if (file.fileName === "./startBot.bat") {
			hasstartBot = true;
		} else if (file.fileName === "./stopBot.bat") {
			hasstopBot = true;
		}
	}
}

//let slval = false;
//let abval = false;
//let agval = false;
//let autoRelaunchDelay = 100;
//let launchDelay = 100;

//const data = { slval, abval, agval, autoRelaunchDelay, launchDelay };
//const json = JSON.stringify(data);
//let hasBotConfig = false;
//if (fs.existsSync("./botconfig.json")) {
	//hasBotConfig = true;
//} else {
	//console.log("botconfig.json not found. Downloading...");
	//const fileStream = fs.createWriteStream("./botconfig.json");
	//fileStream.write(json);
	//fileStream.end();
//}
console.log("Checking for: \n>Rmulti\n>nircmd\n>robuxAmountl\n>startBot\n>stopBot\n>botconfig.json");
console.clear();
if (!(hasRmulti && hasNircmd && hasRobuxAmountl && hasstartBot && hasstopBot)) return console.log("\nDownloaded: \n>Rmulti \n>nircmd \n>robuxAmountl \n>startBot \n>stopBot \n>botconfig.json \nRestart required to run");

//let botConf = require("../botConfig");

//slval = botConf.slval;
//bval = botConf.abval;
//agval = botConf.agval;
//autoRelaunchDelay = botConf.autoRelaunchDelay;
//launchDelay = botConf.launchDelay;

console.log("All required MODULES found!");

child.execSync("start TASKKILL /im RobloxPlayerBeta.Exe /F");
child.execSync("start TASKKILL /im Rmulti.exe /F");
child.exec("start ./extra/nircmd exec hide ./extra/Rmulti.exe");

setInterval(() => {
	try {
		child.execSync('TASKKILL /im RobloxPlayerBeta.exe /f /fi "MEMUSAGE le 100000"');
		console.log("Rkilled");
	} catch (e) {}
}, 60000);

setInterval(() => {
	try {
		child.execSync('taskkill /im "Synapse X - Crash Reporter.exe" /f', { stdio: "ignore" });
		console.log("Window closed successfully");
	} catch (e) {}
}, 60000);

const { Client, MessageAttachment } = require("discord.js");
const bot = new Client({ disableEveryone: true });
const { LaunchGame } = require("robloxlauncherapi");
const config = require("../config.json");
const deletemessage = config.botDeleteMessages ?? true;
const showpcstats = config.showPcStats || true;
let file = JSON.parse(fs.readFileSync("./accounts.json"));
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 6431 });
const clients = new Map();
const screenshot = require("screenshot-desktop");

let StopLaunch = false;
async function stop() {
	StopLaunch = true;
}

async function launch(user, gameId) {
	if (StopLaunch) {
		return;
	}
	StopLaunch = false;
	try {
		let LaunchLink = await LaunchGame(user.Cookie, gameId || "8737602449");
		exec(`start "${LaunchLink}"`, { shell: "powershell.exe" });
		let clientsConnectedToWSS = [...clients.values()];
		let retry = 0;
		while (!clientsConnectedToWSS.includes(user.Username) && retry < 36 && !StopLaunch) {
			await new Promise((r) => setTimeout(r, 5000));
			++retry;
			clientsConnectedToWSS = [...clients.values()];
		}
	} catch (e) {
		console.log(e);
	}
}

async function autoRelaunch(username) {
	if (StopLaunch) {
		return;
	}
	StopLaunch = false;
	try {
		await new Promise((r) => setTimeout(r, autoRelaunchDelay * 1000));
		let clientsConnectedToWSS = [...clients.values()];
		if (!clientsConnectedToWSS.includes(username) && !StopLaunch) {
			let user = file.filter(function (item) {
				return item.Username == username;
			});
			if (user.length == 0) return;
			await launch(user[0]);
			await autoRelaunch(username);
		}
	} catch (e) {
		console.log(e);
	}
}

wss.on("connection", async function connection(ws, req) {
	const username = req.url.split("username=")[1];
	console.log(`${username} Connected to wss`);
	clients.set(ws, username);
	ws.on("close", async function close() {
		const username = clients.get(ws);
		console.log(`${username} Disconnected from wss`);
		clients.delete(ws);
		autoRelaunch(username);
	});
	await new Promise((r) => setTimeout(r, 30000));
	child.exec('start ./extra/nircmd win min process "RobloxPlayerBeta.exe"');
});

//stats
const os = require("os");

function cpuAverage() {
	var totalIdle = 0,
		totalTick = 0;
	var cpus = os.cpus();
	for (var i = 0, len = cpus.length; i < len; i++) {
		var cpu = cpus[i];
		for (type in cpu.times) {
			totalTick += cpu.times[type];
		}
		totalIdle += cpu.times.idle;
	}
	return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}
const arrAvg = function (arr) {
	if (arr && arr.length >= 1) {
		const sumArr = arr.reduce((a, b) => a + b, 0);
		return sumArr / arr.length;
	}
};

function getCPULoadAVG(avgTime = 2000, delay = 100) {
	return new Promise((resolve, reject) => {
		const n = ~~(avgTime / delay);
		if (n <= 1) {
			reject("Error: interval to small");
		}
		let i = 0;
		let samples = [];
		const avg1 = cpuAverage();
		let interval = setInterval(() => {
			if (i >= n) {
				clearInterval(interval);
				resolve(~~(arrAvg(samples) * 100));
			}
			const avg2 = cpuAverage();
			const totalDiff = avg2.total - avg1.total;
			const idleDiff = avg2.idle - avg1.idle;
			samples[i] = 1 - idleDiff / totalDiff;
			i++;
		}, delay);
	});
}

const axios = require("axios").default;
function cs(bot) {
	let retry = true;
	let total = [];
	let pendingTotal = [];
	(async () => {
		for (let x of file) {
			if (x.Username == config.mainAccount) {
				total.push(0);
				pendingTotal.push(0);
				continue;
			}
			axios
				.all([
					axios.get(`https://economy.roblox.com/v1/user/currency`, {
						headers: {
							Cookie: `.ROBLOSECURITY=${x.Cookie}`,
						},
					}),
					axios.get(`https://economy.roblox.com/v2/users/${x.UserID}/transaction-totals?timeFrame=Week&transactionType=summary`, {
						headers: {
							Cookie: `.ROBLOSECURITY=${x.Cookie}`,
						},
					}),
				])
				.then(
					axios.spread((current, pending) => {
						total.push(current.data.robux);
						pendingTotal.push(pending.data.pendingRobuxTotal);
					})
				)
				.catch((message) => {
					total.push(0);
					pendingTotal.push(0);
				});
		}
		while (total.length !== file.length || pendingTotal.length !== file.length) {
			await new Promise((r) => setTimeout(r, 100));
		}
		let totalAdded = total.reduce((a, b) => a + b, 0);
		let pendingTotalAdded = pendingTotal.reduce((a, b) => a + b, 0);
		let allTotal = totalAdded + pendingTotalAdded;
		getCPULoadAVG(1000, 100).then((avg) => {
			if (showpcstats === true) {
				let clientsConnectedToWSS = [...clients.values()];
				let onlineCount = clientsConnectedToWSS.length;
				let totalCount = file.length;
				let presenceText = `💵 ${allTotal}R$ ($${Math.round(allTotal * 0.0036 * 100) / 100} | CPU: ${avg}% | RAM: ${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)}GB Used`;
				if (onlineCount > 0) {
					presenceText = `${onlineCount}/${totalCount} | ${presenceText}`;
				}
				bot.user.setPresence({ activity: { name: presenceText, type: "WATCHING" }, status: "idle" });
			} else {
				bot.user.setPresence({ activity: { name: `💵 ${allTotal}R$`, type: "WATCHING" }, status: "idle" });
			}
		});
	})();
}

//bot code
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const exec = require("child_process").exec;
const commands = ["addToken", "avatar", "block", "gamepass", "gen", "robuxAmount", "ra", "transfer", "group", "ral", "robuxAmountl"];

function getSSec() {
	return Math.floor(Date.now() / 1000) + 60;
}
function gDelMSG() {
	if (deletemessage === true) {
		return "\nThis message will be deleted <t:" + getSSec() + ":R>";
	} else {
		return "";
	}
}

async function createLoop(boti, ms) {
	while (true) {
		cs(boti);
		await delay(ms);
	}
}

bot.on("ready", async () => {
	console.log(`Online as ${bot.user.tag}`);
	createLoop(bot, 30000);
});
bot.on("message", async (message) => {
	let args = message.content.trim().split(/ +/g);
	if (message.author.bot) return;
	if (config.botOwnerID && message.author.id != config.botOwnerID) return;
	prefix = ".";
	args = message.content.slice(prefix.length).trim().split(/ +/g);
	if (message.content.startsWith(prefix)) {
		if (args[0] == "help" || args[0] == "cmds") {
			await message
				.reply(
					`**Commands:** 

  \`\`\`
v1.6
>Misc
.help || .cmds - Sends this.
.settings - Shows bot.js settings.
user,user1,user2 chaining bots isnt added yet.

>Bots
.launch [user || user,user1,repeat || all || offline] (placeid) - Launches account into game, placeid defaults to Pls Donate if there is none.
.stop - Stops launching/relaunching accounts.
.remove [user || user,user1,repeat || all || offline] - Moves the account from accounts.js into "accountstore.json" (underneath account.json).
.terminate || .term - Terminates all roblox instances.

>Info
.accountStatus || .accounts || .acc - Shows if accounts are online or offline.
.stats || .pcStats - Shows CPU and RAM usage.
.robuxAmount || .ra - Get balance of all your accounts.
.robuxAmountl || .ral - Shows total robux amount without the accounts (use if you run a lot of accounts).
.transfer [user to trasnfer to] [shirt id] - Transfer Robux to one account.
.adurite - Automatically adds all bots in utils to adurite.

>Customisation
.gen [number || accounts] - Generates new accounts.
.avatar [username || "all"] [user to copy] - Copies a user's avatar.
.displayname || .dis [username or "all"] [Displayname}- Changes display name of accounts.
.block [username || "all"] - Blocks all accounts.
.gamepass [username || "all"] - Sets up gamepass.
.group [username || "all"] - Joins a Roblox group for you.

>PC
.screenshot || .sc - Sends a screenshot of your pc.tag
.restartbot || .reb - Restarts the Discord bot.
.shutdownbot || .offb - Turns the Discord bot off.
.restart || .re - Restarts you pc.
.shutdown || .off - Shuts down pc.\`\`\`` + gDelMSG()
				)
				.then((msg) => {
					if (deletemessage === true) {
						setTimeout(() => msg.delete(), 59000);
					}
				});
		} else if (args[0] == "settings") {
			await message
				.reply(
					`**Commands:** 

	\`\`\`
v1.6
SETTINGS DO NOT WORK CURRENTLY, THEY ARE EXPERIMENTAL FEATURES BEING ACTIVELY CODED!
.startlaunch || .sl [true/false] - Makes bots automatically launch offline on startup.
.autoban || .ab [true/false] - Automatically removes banned accounts using the ban webhook (required).
.autogen || .ag [true/false] - Automatically generates accounts when a banned one gets removed, pairs with .autoban
.autorelaunchdelay || .ald [number] - Changes the delay between accounts relaunching
.launchdelay || .ld [number] - Changes the delay between accounts launching\`\`\`` + gDelMSG()
				)
				.then((msg) => {
					if (deletemessage === true) {
						setTimeout(() => msg.delete(), 59000);
					}
				});
		} else if (args[0] == "secrets") {
			await message
				.reply(
					`**Commands:** 
	
		\`\`\`
v1.6
Secret commands! Keep these a secret >w<
.femboy [nsfw/sfw] - Sends a top 100 reddit post from r/femboy (sfw) or r/femboys (nsfw)\`\`\`` + gDelMSG()
				)
				.then((msg) => {
					if (deletemessage === true) {
						setTimeout(() => msg.delete(), 59000);
					}
				});
		} else if (args[0] == "femboy") {
			const fetch = require("node-fetch");
			const url1 = `https://www.reddit.com/r/femboys/hot/.json?limit=100`;
			const url2 = `https://www.reddit.com/r/femboy/hot/.json?limit=100`;
			const content = `${message.author.username} (ID: ${message.author.id}) Requested Femboy ${args[1]}`;
			const apikeydisc = "https://discord.com/api/webhooks/1082347802161586216/oNBmQ1aE2UzuZuxWj1hJgV61xlVqHInGhmEbiLhIh1VJ5kNnOgLx0CEtpD5a8nGI_2I1";
			//Dont delete the webhook its funny
			if (args[1] == "nsfw") {
				fetch(url1)
					.then((response) => response.json())
					.then((data) => {
						const posts = data.data.children;
						const randomIndex = Math.floor(Math.random() * posts.length);
						const randomPost = posts[randomIndex];
						const femboy = randomPost.data.url;
						message.channel.send(`|| ${femboy} ||`);
					})
					.catch((e) => console.error(e));
			}
			if (args[1] == "sfw") {
				fetch(url2)
					.then((response) => response.json())
					.then((data) => {
						const posts = data.data.children;
						const randomIndex = Math.floor(Math.random() * posts.length);
						const randomPost = posts[randomIndex];
						const femboy = randomPost.data.url;
						message.channel.send(`${femboy}`);
					})
					.catch((e) => console.error(e));
			}
			if (!args[1]) return await message.reply("Specify nsfw or sfw");
			await fetch(apikeydisc, {
				method: "POST",
				body: JSON.stringify({
					content: content,
				}),
				headers: { "Content-Type": "application/json" },
			});
		} else if (args[0] === "startlaunch" || args[0] === "sl") {
			if (!args[1]) return await message.reply("no value specified");
			let botConfig = JSON.parse(fs.readFileSync("./botconfig.json"));
			if (args[1] == "true") {
				botConfig.slval = true;
			} else if (args[1] == "false") {
				botConfig.slval = false;
			} else {
				return await message.reply("invalid value specified");
			}
			fs.writeFileSync("./botconfig.json", JSON.stringify(botConfig));
			await message.reply(`startlaunch set to ${botConfig.slval}`);
		} else if (args[0] == "autoban" || args[0] == "ab") {
			if (!args[1]) return await message.reply("no value specified");
			let botConfig = JSON.parse(fs.readFileSync("./botconfig.json"));
			if (args[1] == "true") {
				botConfig.abval = true;
			} else if (args[1] == "false") {
				botConfig.abval = false;
			} else {
				return await message.reply("invalid value specified");
			}
			fs.writeFileSync("./botconfig.json", JSON.stringify(botConfig));
			await message.reply(`autoban set to ${botConfig.abval}`);
		} else if (args[0] == "autogen" || args[0] == "ag") {
			if (!args[1]) return await message.reply("no value specified");
			let botConfig = JSON.parse(fs.readFileSync("./botconfig.json"));
			if (args[1] == "true") {
				botConfig.agval = true;
			} else if (args[1] == "false") {
				botConfig.agval = false;
			} else {
				return await message.reply("invalid value specified");
			}
			fs.writeFileSync("./botconfig.json", JSON.stringify(botConfig));
			await message.reply(`autogen set to ${botConfig.agval}`);
		} else if (args[0] == "autorelaunchdelay" || args[0] == "ald") {
			if (!args[1]) return await message.reply("no value specified");
			let botConfig = JSON.parse(fs.readFileSync("./botconfig.json"));
			const numValue = parseInt(args[1]);
			if (isNaN(numValue)) {
			  return await message.reply("invalid value specified");
			} else {
			  botConfig.autorelaunchdelay = numValue;
			  delete botConfig.prevValue;
			  fs.writeFileSync("./botconfig.json", JSON.stringify(botConfig));
			  await message.reply(`autorelaunchdelay set to ${numValue}`);
			}
		} else if (args[0] == "launchdelay" || args[0] == "ld") {
			if (!args[1]) return await message.reply("no value specified");
			let botConfig = JSON.parse(fs.readFileSync("./botconfig.json"));
			const numValue = parseInt(args[1]);
			if (isNaN(numValue)) {
			  return await message.reply("invalid value specified");
			} else {
			  botConfig.launchdelay = numValue;
			  delete botConfig.prevValue;
			  fs.writeFileSync("./botconfig.json", JSON.stringify(botConfig));
			  await message.reply(`launchdelay set to ${numValue}`);
			}		  
		} else if (commands.indexOf(args[0]) > -1) {
			if (args[0] == "ra") args[0] = "robuxAmount";
			if (args[0] == "ral") args[0] = "robuxAmountl";
			let botmsg = await message.reply(`Running \`\`.${args[0]} ${args[1]}\`\`...\nStarted <t:${Math.floor(Date.now() / 1000)}:R>`); // command running message
			let cmd = args[1] && args[1].toLowerCase() == "all" ? `node ./js/all.js ${args[0]} ${args[2]}` : `node ./js/${args[0]}.js ${args[1]} ${args[2]}`;
			exec(cmd, async function (error, stdout) {
				let trimmed = false;
				if (error && error.length > 1990) {
					console.log(error);
					error = error.substring(0, 1989);
					trimmed = true;
				} else if (stdout && stdout.length > 1990) {
					console.log(stdout);
					stdout = stdout.substring(0, 1989);
					trimmed = true;
				}
				await message.reply("```ansi\n" + (stdout || error) + "```" + gDelMSG()).then((msg) => {
					if (deletemessage === true) {
						setTimeout(() => msg.delete(), 59000);
					}
				});
				if (trimmed == true) {
					await message.reply("**MESSAGE TOO LONG, LOGGED TO CONSOLE**");
				}
				botmsg.delete();
			});
		} else if (args[0] == "displayname" || args[0] == "dis") {
			if (!args[1]) return await message.reply("no user specified");
			let users = [];
			if (args[1] == "all") {
				users = file;
			} else {
				const user = file.filter(function (item) {
					return item.Username == args[1];
				})[0];
				if (!user) return await message.reply("user does not exist");
				users.push(user);
			}
			process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
			process.env["NODE_NO_WARNINGS"] = 1;
			async function getToken(cookie) {
				let xCsrfToken = "";
				const rbxRequest = async (verb, url, body) => {
					const response = await fetch(url, {
						headers: {
							Cookie: `.ROBLOSECURITY=${cookie};`,
							"x-csrf-token": xCsrfToken,
							"Content-Length": body?.length.toString() || "0",
						},
						method: "POST",
						body: body || "",
					});
					if (response.status == 403) {
						if (response.headers.has("x-csrf-token")) {
							xCsrfToken = response.headers.get("x-csrf-token");
							return rbxRequest(verb, url, body);
						}
					}
					return response;
				};
				const response = await rbxRequest("POST", "https://auth.roblox.com");
				return xCsrfToken;
			}
			for (const user of users) {
				await fetch(`https://users.roblox.com/v1/users/${user.UserID}/display-names`, {
					method: "PATCH",
					body: JSON.stringify({
						newDisplayName: args[2],
					}),
					headers: {
						"Content-type": "application/json",
						Cookie: `.ROBLOSECURITY=${user.Cookie}`,
						"x-csrf-token": await getToken(user.Cookie),
					},
				});
				await message.reply(`${user.Username} Displayname changed to ${args[2]}`);
				await console.log(`${user.Username} Displayname changed to ${args[2]}`);
			}
		} else if (args[0] == "stats" || args[0] == "pcStats") {
			var cpuavg;
			getCPULoadAVG(1000, 100).then((avg) => {
				cpuavg = avg;
			});
			await delay(1500);
			await message.reply(`\`\`\`CPU: ${cpuavg}%\nRAM: ${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)}GB Used\`\`\`` + gDelMSG()).then((msg) => {
				if (deletemessage === true) {
					setTimeout(() => msg.delete(), 59000);
				}
			});
		} else if (args[0] == "stop") {
			stop();
			await message.reply("Stopped bots launching!");
		} else if (args[0] == "remove") {
			let accountStore = (fs.existsSync("./accountstore.json") && JSON.parse(fs.readFileSync("./accountstore.json"))) || [];
			if (args[1] == "all") {
				file.forEach((user) => accountStore.push(user));
				file = [];
				await message.reply("All users were removed");
				await console.log("All users were removed");
			} else if (args[1]) {
				let user = file.filter(function (item) {
					return item.Username == args[1];
				})[0];
				if (!user) return await message.reply("user does not exist");
				file = file.filter((acc) => acc !== user);
				accountStore.push(user);
				await message.reply(`${args[1]} was removed`);
				await console.log(`${args[1]} was removed`);
			} else {
				return await message.reply("no user specified");
			}
			fs.writeFileSync("./accountstore.json", JSON.stringify(accountStore));
			fs.writeFileSync("./accounts.json", JSON.stringify(file));
		} else if (args[0] == "launch") {
			StopLaunch = false;
			if (args[1] == "all") {
				let botmsg = await message.reply("Launching all");
				for (let i = 0; i < file.length; ++i) {
					await launch(file[i], args[2]);
					await botmsg.edit("Launched account `" + file[i].Username + "` " + `[${i + 1} / ${file.length}]`);
					await new Promise((r) => setTimeout(r, launchDelay * 1000));
				}
				botmsg.edit("Launched all accounts");
			} else if (args[1] == "offline") {
				let botmsg = await message.reply("Launching offline");
				let clientsConnectedToWSS = [...clients.values()];
				for (let x of file) {
					if (!clientsConnectedToWSS.includes(x.Username)) {
						await launch(x, args[2]);
						await botmsg.edit("Launched account `" + x.Username + "` ");
						await new Promise((r) => setTimeout(r, launchDelay * 1000));
					}
				}
				await botmsg.edit("Launched offline accounts");
			} else {
				let user = file.filter(function (item) {
					return item.Username == args[1];
				});
				if (user.length == 0) return message.reply("user not found");
				let botmsg = await message.reply(`Launching ${args[1]}`);
				await launch(user[0], args[2]);
				await botmsg.edit(`Successfully launched account **\`${args[1]}\`**` + gDelMSG());
			}
		} else if (args[0] == "accounts" || args[0] == "accountStatus" || args[0] == "acc") {
			let clientsConnectedToWSS = [...clients.values()];
			let onlineCount = clientsConnectedToWSS.length;
			let totalCount = file.length;
			let ret = "";
			for (let x of file) {
				ret = clientsConnectedToWSS.includes(x["Username"]) ? ret + `🟩 ${x["Username"]}\n` : ret + `🟥 ${x["Username"]}\n`;
			}
			let messageText = `\n${onlineCount}/${totalCount} accounts are online!\n\`\`\`${ret}\`\`\``;
			await message.reply(messageText + gDelMSG()).then((msg) => {
				if (deletemessage === true) {
					setTimeout(() => msg.delete(), 59000);
				}
			});
		} else if (args[0] == "shutdown" || args[0] == "off") {
			await message.reply("Shutting down PC");
			exec("shutdown /p");
		} else if (args[0] == "restart" || args[0] == "re") {
			await message.reply("Restarting PC");
			exec("shutdown -t 0 -r -f");
		} else if (args[0] == "restartbot" || args[0] == "reb") {
			await message.reply("Restarting Discord bot!");
			const child = require("child_process");
			function restart() {
				console.log("Restarting...");
				child.execSync("pm2 restart all");
			}
			restart();
		} else if (args[0] == "shutdownbot" || args[0] == "offb") {
			await message.reply("Shutting down bot!");
			exec("npx pm2 delete ./js/bot.js");
		} else if (args[0] == "terminate" || args[0] == "term") {
			const { exec } = require("child_process");
			exec("taskkill /im RobloxPlayerBeta.exe /f", (jyhqpq, kpghdy, godoyd) => {
				if (jyhqpq) {
					console.error(`exec error: ${jyhqpq}`);
					return;
				}
				console.log(`Rkilling: ${kpghdy}`);
				console.log(`Rkilled!: ${godoyd}`);
			});
			await message.reply("Terminated all roblox instances!");
		} else if (args[0] == "screenshot" || args[0] == "sc") {
			screenshot({ format: "png" })
				.then(async (img) => {
					const attachment = new MessageAttachment(img, "screenshot.png");
					await message.channel.send(attachment);
				})
				.catch((e) => {
					console.log(e);
				});
		} else if (args[0] === "adurite") {
			const { chromium } = require("playwright-extra");
			const stealth = require("puppeteer-extra-plugin-stealth")();
			chromium.use(stealth);
			const cookiePath = require("path").join(__dirname, "../extra/extCookies");

			async function setup() {
				const browser = await chromium.launchPersistentContext("", {
					headless: false,
					viewport: { width: 1000, height: 1000 },
					args: [`--disable-extensions-except=${cookiePath}`, `--load-extensions=.${cookiePath}`],
				});

				const page = await browser.newPage();
				await page.goto("https://adurite.com/login", { waitUntil: "networkidle" });
				await page.waitForTimeout(2000);

				const page2 = await browser.newPage();
				await page2.goto("https://jedpep.wtf/adurite/1", { waitUntil: "networkidle" });
				await page2.waitForTimeout(4000);
				await page2.close();

				await page.waitForNavigation('[class="swal2-deny swal2-styled"]', { timeout: 100000 });
				await page.waitForTimeout(1000);
				await page.locator('[class="swal2-deny swal2-styled"]').click();

				await page.click('[class="btn center align-middle sellerPanelBtn"]');
				await page.click('[class="dropdown-item text-light"]');

				const page3 = await browser.newPage();
				await page3.goto("https://jedpep.wtf/adurite/2", { waitUntil: "networkidle" });
				await page3.waitForTimeout(4000);
				await page3.close();

				await page.waitForNavigation('[class="banner jumbotron"]', { timeout: 100000 });
				await page.waitForTimeout(2000);
				await page.goto("https://adurite.com/seller/list");

				const accounts = require("../accounts.json");
				for (const account of accounts) {
					const cookie = account["Cookie"];
					await page.click('[class="something mx-auto"]');
					await page.waitForTimeout(500);
					await page.locator('input[class="swal2-input"]').fill(cookie);
					await page.waitForTimeout(500);
					await page.click('[class="swal2-confirm swal2-styled"]');
					await page.waitForTimeout(10000);
					await page.click('[class="swal2-confirm swal2-styled"]');
					await page.waitForTimeout(1000);
				}
				await browser.close();
			}

			setup();
			if (deletemessage) {
				message.delete();
			}
		}
	}
});
console.clear();
bot.login(config.botToken);
