"use strict";
// cSpell:ignore randomatic

// delete
import express from "express";
import chalk from "chalk";
import cors from "cors";
import randomatic from "randomatic";
import bcrypt from "bcrypt";
import mongoose, { get } from "mongoose";
import url from "url";
import path from "path";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let mongoConnection = "mongodb+srv://admin:IpQnoc0Vjl5hZxvL@purple_2048.ap4rwmw.mongodb.net/Purple_2048";
let db = mongoose.connection;

db.on("connecting", () => {
	console.log(chalk.blue("connecting"));
});

db.on("connected", () => {
	console.log(chalk.green("connected"));
});

const app = express();
const port = 4000;

let userSchema = mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	saveBoards: {
		type: [],
	},
	bests: {
		type: [],
	},
	leader: {
		type: Number,
		default: 0,
	},
	token: {
		type: String,
	},
});
let User = mongoose.model("users", userSchema);

async function authenticate(req, res, next) {
	if (req.originalUrl == "/api/users" && req.method == "POST") {
		next();
		return;
	}
	if (!req.get("x-auth-user")) {
		res.status(401);
		res.send("Missing token");
		return;
	}
	try {
		let user = await User.findOne({ token: req.get("x-auth-user") });
		if (user == undefined) {
			res.status(401);
			res.send("Invalid token");
			return;
		}
		req.id = user._id;
		next();
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
}

app.use(
	cors({
		methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
	})
);
app.use(express.json());

app.use(express.static(__dirname));

app.use("/api/users", authenticate);
app.use("/api/users/bestScores", authenticate);
app.use("/api/users/saveGames", authenticate);
app.use("/api/users/leaders", authenticate);

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "./FRONTEND/login.html"));
});

app.put("/api/login", async (req, res) => {
	let v = false;
	let text = "The following attributes are missing: ";
	if (req.body.username == undefined) {
		v = true;
		text += "username, ";
	}
	if (req.body.password == undefined) {
		v = true;
		text += "password, ";
	}
	if (v) {
		res.status(400);
		res.send(text.substring(0, text.length - 2));
		return;
	}

	try {
		let user = await User.findOne({ username: req.body.username });
		if (user == null) {
			res.status(401);
			res.send("User doesn't exist");
			return;
		}
		if (!bcrypt.compareSync(req.body.password, user.password)) {
			res.status(401);
			res.send("Incorrect password");
			return;
		}
		if (user.token == undefined) {
			user.token = randomatic("Aa0", "10") + "-" + user._id;
			await user.save();
		}
		res.send(user.token);
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.get("/api/users", async (req, res) => {
	try {
		let user = await User.findById(req.id);
		res.send(user);
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.post("/api/users", async (req, res) => {
	let v = false;
	let text = "The following attributes are missing: ";
	if (req.body.email == undefined) {
		v = true;
		text += "email, ";
	}
	if (req.body.password == undefined) {
		v = true;
		text += "password, ";
	}
	if (req.body.username == undefined) {
		v = true;
		text += "username, ";
	}
	if (v) {
		res.status(400);
		res.send(text.substring(0, text.length - 2));
		return;
	}
	try {
		let user = await User.find({ username: req.body.username });
		if (user.length != 0) {
			res.status(400);
			res.send("Username already exist");
			return;
		}
		req.body.password = bcrypt.hashSync(req.body.password, 10);
		user = await User(req.body);
		await user.save();
		res.status(201);
		res.send(user);
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.put("/api/users", async (req, res) => {
	try {
		let user = await User.findById(req.id);
		if (req.body.oldPassword != undefined && !bcrypt.compareSync(req.body.oldPassword, user.password)) {
			res.status(401);
			res.send("Wrong password");
			return;
		} else if (req.body.password != undefined) {
			req.body.password = bcrypt.hashSync(req.body.password, 10);
		}
		if (req.body.username != undefined) {
			let usernameUnique = await User.find({ username: req.body.username });
			if (usernameUnique.length != 0) {
				res.status(400);
				res.send("Username already exists...");
				return;
			}
		}
		user = Object.assign(user, req.body);
		await user.save();
		res.send(JSON.stringify(user));
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.delete("/api/users", async (req, res) => {
	try {
		await User.deleteOne({ _id: req.id });
		res.send();
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.get("/api/users/bestScores", async (req, res) => {
	try {
		if (req.query.index == undefined) {
			let best = await User.findById(req.id).select("bests -_id");
			res.send(JSON.stringify(best));
			return;
		}
		let best = await User.findById(req.id).select("bests -_id");
		res.send(JSON.stringify(best.bests[req.query.index]));
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.put("/api/users/bestScores", async (req, res) => {
	try {
		let user = await User.findById(req.id);
		if (user.bests == undefined) {
			user.bests = [];
		}
		let i;
		for (i = 0; i < user.bests.length; i++) {
			if (req.body.score > user.bests[i].score) break;
		}
		user.bests.splice(i, 0, req.body);
		if (user.bests.length > 5) {
			user.bests.pop();
		}

		let saves = await User.where("leader").gt(0);

		if (saves.length == 0) {
			user.leader += 1;
		} else {
			let cnt = 0;
			let lastBest = saves[0];
			saves.forEach((item) => {
				if (item.bests[item.leader - 1].score < lastBest.bests[item.leader - 1].score) lastBest = item;
				cnt += item.leader;
			});
			if (cnt == 5 && lastBest.bests[lastBest.leader - 1].score < req.body.score) {
				if (user.username != lastBest.username) {
					user.leader += 1;
					lastBest.leader -= 1;
					await lastBest.save();
				}
			} else if (cnt < 5) {
				user.leader += 1;
			}
		}
		await user.save();
		res.send("Save successfully");
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.get("/api/users/saveGames", async (req, res) => {
	try {
		if (req.query.index == undefined) {
			let saves = await User.findById(req.id).select("saveBoards -_id");
			res.send(JSON.stringify(saves));
			return;
		}
		let saves = await User.findById(req.id).select("saveBoards -_id");
		res.send(JSON.stringify(saves.saveBoards[req.query.index]));
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.put("/api/users/saveGames", async (req, res) => {
	try {
		let user = await User.findById(req.id);

		let index = user.saveBoards.findIndex((item) => item.name == req.body.name);
		if (index != -1) {
			user.saveBoards.splice(index, 1);
		}

		if (user.saveBoards != undefined && user.saveBoards.length == 5) {
			user.saveBoards.shift();
		}

		user.saveBoards.push(req.body);
		await user.save();
		res.send("Save successfully");
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

app.get("/api/users/leaders", async (req, res) => {
	try {
		let saves = await User.where("leader").gt(0).select("leader bests username -_id");
		if (saves.length == 0) {
			res.send(JSON.stringify(saves));
			return;
		}
		let leaders = [];
		saves.forEach((item) => {
			for (let i = 0; i < item.leader; i++) {
				leaders.push({
					username: item.username,
					score: item.bests[i].score,
				});
			}
		});

		leaders.sort((a, b) => b.score - a.score);
		res.send(JSON.stringify(leaders));
	} catch (e) {
		console.log(chalk.red(e));
		res.status(500);
		res.send("Fatal Error");
	}
});

mongoose.connect(mongoConnection, { useNewUrlParser: true });
app.listen(port, () => {
	console.log("API running on port " + port);
});
