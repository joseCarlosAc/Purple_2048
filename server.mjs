"use strict";
// cSpell:ignore randomatic
import  express  from "express";
import chalk from "chalk";
import cors from "cors";
import randomatic from "randomatic";
import bcrypt from "bcrypt";
import mongoose, { get } from "mongoose";

let mongoConnection= "mongodb+srv://admin:IpQnoc0Vjl5hZxvL@purple_2048.ap4rwmw.mongodb.net/Purple_2048";
let db=mongoose.connection;

db.on('connecting',()=>{
    console.log(chalk.blue("connecting"));
});

db.on('connected',()=>{
    console.log(chalk.green('connected'));
});


const app=express();
const port=3000;

let userSchema=mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    saveBoards:{
        type:[],
    },
    bests:{
        type:[]
    },
    leader:{
        type:Number,
        default:0
    },
    token:{
        type:String
    }
});
let User=mongoose.model('users',userSchema);

async function authenticate(req, res, next){
    if(req.originalUrl=="/api/users" && req.method=="POST"){
        next();
        return;
    }
    if(!req.get("x-auth-user")){
        res.status(401);
        res.send("missing token");
        return;
    }
    try{
        let user=await User.findOne({token:req.get("x-auth-user")});
        if(user==undefined){
            res.status(401);
            res.send("invalid token");
            return;
        }
        req.id=user._id;
        next();
    }catch(e){
        console.log(chalk.red(e.message));
    }
}

app.use(cors({
    methods:['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));
app.use(express.json());
app.use("/api/users",authenticate);
app.use("/api/users/bestScores",authenticate);
app.use("/api/users/bestScore",authenticate);
app.use("/api/users/loadGames",authenticate);
app.use("/api/users/loadGame",authenticate);
app.use("/api/users/leaders",authenticate);
app.use("/api/users/saveGames",authenticate);

app.put("/api/login", async (req,res)=>{
    let v=false;
    let text="The following attributes are missing: ";
    if(req.body.username==undefined){
        v=true;
        text+="username, ";
    }
    if(req.body.password==undefined){
        v=true;
        text+="password, ";
    }
    if(v){
        res.status(400);
        res.send(text.substring(0,text.length-2));
        return;
    }
    
    try{
        let user= await User.findOne({username: req.body.username});
        if(user==null){
            res.status(401);
            res.send("user doesn't exist");
            return;
        }
        if(!bcrypt.compareSync(req.body.password,user.password)){
            res.status(401);
            res.send("incorrect password");
            return;
        }
        if(user.token==undefined){
            user.token=randomatic('Aa0','10')+"-"+user._id;
            await user.save()
        }
        res.send(user.token);
    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.post("/api/users", async (req,res)=>{
    let v=false;
    let text="The following attributes are missing: ";
    if(req.body.email==undefined){
        v=true;
        text+="email, ";
    }
    if(req.body.password==undefined){
        v=true;
        text+="password, ";
    }
    if(req.body.username==undefined){
        v=true;
        text+="username, ";
    }
    if(v){
        res.status(400);
        res.send(text.substring(0,text.length-2));
        return;
    }try{
        let user= await User.find({username: req.body.username});
        if(user.length!=0){
            //await User.deleteOne({"username":req.body.username});
            res.status(400);
            res.send("username already exist");
            return;
        }
        req.body.password=bcrypt.hashSync(req.body.password,10);
        user= await User(req.body);
        await user.save();
        res.status(201);
        res.send(user);

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.get("/api/users", async (req,res)=>{
    try{
        let user= await User.findById(req.id);
        res.send(user);

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.get("/api/users/bestScores", async (req,res)=>{
    try{
        let best= await User.findById(req.id).select("bests -_id");
        res.send(JSON.stringify(best));

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.get("/api/users/loadGames", async (req,res)=>{
    try{
        let saves= await User.findById(req.id).select("saveBoards -_id");
        res.send(JSON.stringify(saves));

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.get("/api/users/leaders", async (req,res)=>{
    try{
        let saves= await User.where("leader"). gt(0).select("leader bests username -_id");
        if(saves.length==0){
            res.send(JSON.stringify(saves));
            return;
        }
        let leaders=[];
        saves.forEach(item=>{
            for(let i=0; i<item.leader; i++){
                leaders.push({
                    "username":item.username,
                    "score":item.bests[i].score
                });
            }
        });

        leaders.sort((a,b)=>b.score-a.score);
        res.send(JSON.stringify(leaders));
        
    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.put("/api/users/saveGames", async (req,res)=>{
    try{
        let user= await User.findById(req.id);
        if(user.saveBoards!=undefined && user.saveBoards.length==5){
            user.saveBoards.shift();
        }
        
        user.saveBoards.push(req.body);
        await user.save();
        res.send("save successfully");

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.get("/api/users/loadGame", async (req,res)=>{
    try{
        let saves= await User.findById(req.id).select("saveBoards -_id");
        res.send(JSON.stringify(saves.saveBoards[req.get("index")]));

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.put("/api/users/bestScores", async (req,res)=>{
    try{
        let user= await User.findById(req.id);
        if(user.bests==undefined){
            user.bests=[];
        }
        let i;
        for(i=0; i<user.bests.length; i++){
            if(req.body.score>user.bests[i].score) break;
        }
        user.bests.splice(i,0,req.body);
        if(user.bests.length>5){
            user.bests.pop();
        }
        let lastBest= await User.where("leader").gt(0).sort({"best[0].score":1}).limit(1);
        let saves= await User.where("leader"). gt(0).select("leader -_id");
        let cnt=0;
        saves.forEach(item=>{
            cnt+=item.leader;
        });
        if(lastBest.length==0){
            user.leader+=1
        }
        else if(cnt==5 && lastBest[0].bests[0+lastBest[0].leader-1].score<req.body.score){
            console.log(user.username);
            console.log(lastBest[0].username);
            if(user.username!=lastBest[0].username){
                user.leader+=1;
                lastBest[0].leader-=1;
                await lastBest[0].save();   
            }
        }
        else{
            user.leader+=1;
        }
        await user.save();
        res.send("save successfully");

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

app.get("/api/users/bestScore", async (req,res)=>{
    try{
        let best= await User.findById(req.id).select("bests -_id");
        res.send(JSON.stringify(best.bests[req.get("index")]));

    }catch(e){
        console.log(chalk.red(e.message));
    }
});

mongoose.connect(mongoConnection,{useNewUrlParser:true});
app.listen(port);