
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");

const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
const app=express();
const https=require("https");
const request=require("request");
const codeForces=require("codeforces-api");
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
  secret:"ourlittlesecret",
  resave:false,
  saveUninitialized:false                           //useful for logging session.
}));
app.use(passport.initialize());                     // initilze passport
app.use(passport.session());                        //initialize session
mongoose.connect("mongodb://localhost:27017/codebreaker",{useNewUrlParser: true,useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);

const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  codeforcehandle:String,
  name:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});    // mongoose-encrypt the password
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  });
});                                 //setting passport to serialize and deserialize user.

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/details",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"      // not retreiving information from google plus account but from the user info
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



let correct=0,dpCount=0,arrayCount=0,greedyCount=0,graphCount=0,treeCount=0,mathCount=0,bfCount=0,noTheoryCount=0,otherCount=0;
app.post("/register",function(req,res){
  console.log(req.body.username);

  User.findOne({"username":req.body.username},function(err,foundUser){

    if(foundUser && req.body.password)
    {
      res.redirect("/userexist");
    }
    else
    {
      User.register({username:req.body.username},req.body.password,function(err,user){
        if(err)
        {
          console.log(err);
          res.redirect("/error");
        }
        else
        {
          passport.authenticate("local")(req,res,function(){                        //If authenticated them redirect to the secrets page
            res.redirect("/details");
          })
        }
      });
    }
  });

});
app.get("/",function(req,res){
  res.render("home");
})
app.get("/register",function(req,res){
  res.render("register");
})
app.get("/error",function(req,res){
  res.render("errorregister");
})

app.get("/login",function(req,res){
  res.render("login");
})
app.get("/errorlogin",function(req,res){
  res.render("errorlogin");
})
app.get("/userexist",function(req,res){
  res.render("userexist");
})
app.get("/details",function(req,res){
  if(req.isAuthenticated()){                                      //Authenticate for the pages that have to be given access after login.
    res.render("userDetails");
  }
  else{
    res.redirect("/register");                                     //if not authenticated then redirect to login page again.
  }

})
app.get("/auth/google",passport.authenticate('google',{                 //authenticate user using google strategy
  scope:['profile']
}));
app.get("/auth/google/details",passport.authenticate("google",{
  failureRedirect:'/login'
}),
function(req,res){
  //Successfull Login
  res.redirect("/details");
});
app.post("/details",function(req,res){
  console.log(req.user.id);
  console.log(req.body.userhandle);
  const submittedhandle=req.body.userhandle;
  const submittedname=req.body.username;
  User.findById(req.user.id,function(err,foundUser){
    if(err)
    {
      console.log(err);
    }
    else
    {
      if(foundUser)
      {
        foundUser.codeforcehandle=submittedhandle;
        foundUser.name=submittedname;
        foundUser.save(function(){
          res.redirect("/dashboard");
        });
      }
    }
  });
});
app.post("/login",function(req,res){

  const user=new User({                                             //Creating a user.
    username:req.body.username,
    password:req.body.password
  });

req.login(user,function(err){
  if(err)
  {
    console.log(err);
    res.redirect("errorlogin");
  }
  else
  {
    passport.authenticate("local")(req,res,function(err){                 //authenticate user suing local strategy
      res.redirect("/dashboard");
    });
  }
})
});
app.get("/dashboard",function(req,res){
  if(req.isAuthenticated()){                                      //Authenticate for the pages that have to be given access after login.
    const user=req.body.userhandle;                                                      //geetansh.atrey
    User.findById(req.user.id,function(err,foundUser){
      if(err)
      {
        console.log(err);
      }
      if(!foundUser.codeforcehandle)                                 //If user got registered but haven't entered the codeforces handle.
      {
        res.redirect("/details");
      }
      else{

        if(foundUser && foundUser.codeforcehandle);
        {
          console.log(foundUser.codeforcehandle);
          const url1="https://codeforces.com/api/user.status?handle="+foundUser.codeforcehandle;
          const url2="https://codeforces.com/api/user.info?handles="+foundUser.codeforcehandle;
          https.get(url1,function(response){
            console.log(response.statusCode);
            var chunks="";
            response.on("data",function(chunk){
                chunks +=chunk;
            });
            response.on("end",function(){
              const infoData=JSON.parse(chunks);
              console.log(infoData);
              const submission=infoData.result.length;
              console.log(submission);
              for(let i=0;i<submission;i++)
              {
                if(infoData.result[i].verdict==="OK")
                {
                  correct++;
                }
                let tag=infoData.result[i].problem.tags.length;

                for(let j=0;j<tag;j++)
                {

                  if(infoData.result[i].verdict==="OK"){

                    if(infoData.result[i].problem.tags[j] ==="dp" )
                    {
                      dpCount++;
                    }
                    else if(infoData.result[i].problem.tags[j] ==="greedy")
                    {
                      greedyCount++;
                    }
                    else if(infoData.result[i].problem.tags[j] ==="math")
                    {
                      mathCount++;
                    }
                    else if(infoData.result[i].problem.tags[j]==="graph matchings")
                    {
                      graphCount++;
                    }

                    else if(infoData.result[i].problem.tags[j]==="number theory")
                    {
                      noTheoryCount++;
                    }
                    else{
                      otherCount++;
                    }
                  }

                }

              }

              let efficiency=((correct/submission)*100).toFixed(2);
              const history=[0];
              const status=[];
              const problemId=[];
              const problemIndex=[];

              for(let i=0;i<8;i++)
              {
                history[i]=infoData.result[i].problem.name;
                status[i]=infoData.result[i].verdict;
                problemId[i]=infoData.result[i].problem.contestId;
                problemIndex[i]=infoData.result[i].problem.index;
              }

              https.get(url2,function(response){
                console.log(response.statusCode);
                response.on("data",function(data){
                  const infoData=JSON.parse(data);
                  const titlepic=infoData.result[0].titlePhoto;

                  res.render("dashboard",{
                    totalSubmission:submission,
                    username:foundUser.name,
                    array: arrayCount,
                    math: mathCount,
                    greedy:greedyCount,
                    graph:graphCount,
                    dp: dpCount,
                    bf:bfCount,
                    noTheory:noTheoryCount,
                    other:otherCount,
                    history:history,
                    statusinfo:status,
                    correctsubmission:correct,
                    efficiency:efficiency,
                    profilepic:titlepic,
                    problemId:problemId,
                    problemIndex:problemIndex

                  });

                    efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
                });
              });
            });
          });

        }

      }
    })
  }

  else{
    res.redirect("/login");                                     //if not authenticated then redirect to login page again.
  }
});


app.get("/CodeItOut",function(req,res){

  if(req.isAuthenticated()){                                      //Authenticate for the pages that have to be given access after login.
    const user=req.user;
    console.log(user);                                                    //geetansh.atrey
    User.findById(user.id,function(err,foundUser){
      if(err)
      {
        console.log(err);
      }
      else
      {
        const url1="https://codeforces.com/api/user.status?handle="+foundUser.codeforcehandle;
        const url2="https://codeforces.com/api/user.info?handles="+foundUser.codeforcehandle;
        https.get(url1,function(response){
          console.log(response.statusCode);
          var chunks="";
          response.on("data",function(chunk){
              chunks +=chunk;
          });
          response.on("end",function(){
            const infoData=JSON.parse(chunks);
            console.log(infoData);
        const history=[0];
        const status=[];
        const problemId=[];
        const problemIndex=[];
        for(let i=0;i<8;i++)
        {
          history[i]=infoData.result[i].problem.name;
          status[i]=infoData.result[i].verdict;
          problemId[i]=infoData.result[i].problem.contestId;
          problemIndex[i]=infoData.result[i].problem.index;
        }

        https.get(url2,function(response){
          console.log(response.statusCode);
          response.on("data",function(data){
            const infoData=JSON.parse(data);
            const titlepic=infoData.result[0].titlePhoto;

            res.render("codeitout",{

              username:foundUser.name,
              history:history,
              statusinfo:status,
              profilepic:titlepic,
              problemId:problemId,
              problemIndex:problemIndex
            });

              efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
          });
        });
      });
  });
  }

  });
}
else{
  res.redirect("/login");
}
});

app.get("/CodeForces",function(req,res){
  if(req.isAuthenticated()){                                      //Authenticate for the pages that have to be given access after login.
    const user=req.user;
    console.log(user);                                                    //geetansh.atrey
    User.findById(user.id,function(err,foundUser){
      if(err)
      {
        console.log(err);
      }
      else
      {
        const url1="https://codeforces.com/api/user.status?handle="+foundUser.codeforcehandle;
        const url2="https://codeforces.com/api/user.info?handles="+foundUser.codeforcehandle;
        https.get(url1,function(response){
          console.log(response.statusCode);
          var chunks="";
          response.on("data",function(chunk){
              chunks +=chunk;
          });
          response.on("end",function(){
            const infoData=JSON.parse(chunks);
            console.log(infoData);
        const history=[0];
        const status=[];
        const problemId=[];
        const problemIndex=[];
        for(let i=0;i<8;i++)
        {
          history[i]=infoData.result[i].problem.name;
          status[i]=infoData.result[i].verdict;
          problemId[i]=infoData.result[i].problem.contestId;
          problemIndex[i]=infoData.result[i].problem.index;
        }

        https.get(url2,function(response){
          console.log(response.statusCode);
          response.on("data",function(data){
            const infoData=JSON.parse(data);
            const titlepic=infoData.result[0].titlePhoto;

            res.render("hackerrank",{

              username:foundUser.name,
              history:history,
              statusinfo:status,
              profilepic:titlepic,
              problemId:problemId,
              problemIndex:problemIndex
            });

              efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
          });
        });
      });
  });
  }

  });
}
else{
  res.redirect("/login");
}
});

app.get("/HackerRank",function(req,res){
  if(req.isAuthenticated()){                                      //Authenticate for the pages that have to be given access after login.
    const user=req.user;
    console.log(user);                                                    //geetansh.atrey
    User.findById(user.id,function(err,foundUser){
      if(err)
      {
        console.log(err);
      }
      else
      {
        const url1="https://codeforces.com/api/user.status?handle="+foundUser.codeforcehandle;
        const url2="https://codeforces.com/api/user.info?handles="+foundUser.codeforcehandle;
        https.get(url1,function(response){
          console.log(response.statusCode);
          var chunks="";
          response.on("data",function(chunk){
              chunks +=chunk;
          });
          response.on("end",function(){
            const infoData=JSON.parse(chunks);
            console.log(infoData);
        const history=[0];
        const status=[];
        const problemId=[];
        const problemIndex=[];
        for(let i=0;i<8;i++)
        {
          history[i]=infoData.result[i].problem.name;
          status[i]=infoData.result[i].verdict;
          problemId[i]=infoData.result[i].problem.contestId;
          problemIndex[i]=infoData.result[i].problem.index;
        }

        https.get(url2,function(response){
          console.log(response.statusCode);
          response.on("data",function(data){
            const infoData=JSON.parse(data);
            const titlepic=infoData.result[0].titlePhoto;

            res.render("hackerrank",{

              username:foundUser.name,
              history:history,
              statusinfo:status,
              profilepic:titlepic,
              problemId:problemId,
              problemIndex:problemIndex
            });

              efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
          });
        });
      });
  });
  }

  });
}
else{
  res.redirect("/login");
}
});




app.get("/analysingyou",function(req,res){
  res.sendFile(__dirname+"/analysing-final.html");
});
app.get("/brocode",function(req,res){
  res.render("broCode");
});

app.get("/CodeForTheDay",function(req,res){
  if(req.isAuthenticated()){                                      //Authenticate for the pages that have to be given access after login.
    const user=req.user;
    console.log(user);                                                    //geetansh.atrey
    User.findById(user.id,function(err,foundUser){
      if(err)
      {
        console.log(err);
      }
      else
      {
        const url1="https://codeforces.com/api/user.status?handle="+foundUser.codeforcehandle;
        const url2="https://codeforces.com/api/user.info?handles="+foundUser.codeforcehandle;
        https.get(url1,function(response){
          console.log(response.statusCode);
          var chunks="";
          response.on("data",function(chunk){
              chunks +=chunk;
          });
          response.on("end",function(){
            const infoData=JSON.parse(chunks);
            console.log(infoData);
        const history=[0];
        const status=[];
        const problemId=[];
        const problemIndex=[];
        for(let i=0;i<8;i++)
        {
          history[i]=infoData.result[i].problem.name;
          status[i]=infoData.result[i].verdict;
          problemId[i]=infoData.result[i].problem.contestId;
          problemIndex[i]=infoData.result[i].problem.index;
        }

        https.get(url2,function(response){
          console.log(response.statusCode);
          response.on("data",function(data){
            const infoData=JSON.parse(data);
            const titlepic=infoData.result[0].titlePhoto;

            res.render("CodeForTheDay",{

              username:foundUser.name,
              history:history,
              statusinfo:status,
              profilepic:titlepic,
              problemId:problemId,
              problemIndex:problemIndex
            });

              efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
          });
        });
      });
  });
  }

  });
}
else{
  res.redirect("/login");
}
});

app.get("/HackerRank",function(req,res){
  res.render("hackerrank");
});
app.get("/Leetcode",function(req,res){
  res.render("leetcode");
});
app.get("/mydoubt",function(req,res){
  res.render("mydoubt");
});
app.get("/history",function(req,res){
  res.render("history");
});
app.get("/particularDoubt",function(req,res){
  res.render("particulardoubt");
});
app.get("/UpcomingContest",function(req,res){
  res.render("upcomingcontest");
});


app.listen(3000,function(req,res){
  console.log("Server running at 3000");
});
