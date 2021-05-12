const express=require("express");
const bodyParser=require("body-parser");
const app=express();
const https=require("https");
const request=require("request");
const codeForces=require("codeforces-api");
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

let correct=0,dpCount=0,arrayCount=0,greedyCount=0,graphCount=0,treeCount=0,mathCount=0,bfCount=0,noTheoryCount=0,otherCount=0;
app.get("/",function(req,res){
  const user="geetansh.atrey";
  const url1="https://codeforces.com/api/user.status?handle="+user;
  const url2="https://codeforces.com/api/user.info?handles="+user;
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
      for(let i=0;i<8;i++)
      {
        history[i]=infoData.result[i].problem.name;
        status[i]=infoData.result[i].verdict;
      }

      https.get(url2,function(response){
        console.log(response.statusCode);
        response.on("data",function(data){
          const infoData=JSON.parse(data);
          const titlepic=infoData.result[0].titlePhoto;

          res.render("dashboard",{
            totalSubmission:submission,
            username:user,
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
          });

            efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
        });
      });




});


});



});
app.get("/CodeItOut",function(req,res){
  const user="geetansh.atrey";
  const url1="https://codeforces.com/api/user.status?handle="+user+"&from=1&count=30";
  const url2="https://codeforces.com/api/user.info?handles="+user;
  https.get(url1,function(response){
    console.log(response.statusCode);
    response.on("data",function(data){
      const infoData=JSON.parse(data);
      const history=[0];
      const status=[];
      for(let i=0;i<8;i++)
      {
        history[i]=infoData.result[i].problem.name;
        status[i]=infoData.result[i].verdict;
      }

      https.get(url2,function(response){
        console.log(response.statusCode);
        response.on("data",function(data){
          const infoData=JSON.parse(data);
          const titlepic=infoData.result[0].titlePhoto;

          res.render("codeitout",{

            username:user,
            history:history,
            statusinfo:status,
            profilepic:titlepic
          });

            efficiency=0;correct=0;dpCount=0;arrayCount=0;greedyCount=0;graphCount=0;treeCount=0;mathCount=0;bfCount=0;noTheoryCount=0;otherCount=0;
        });
      });
});
});
});
app.get("/analysingyou",function(req,res){
  res.sendFile(__dirname+"/analysing-final.html");
});
app.get("/brocode",function(req,res){
  res.sendFile(__dirname+"/broCode.html");
});
app.get("/CodeForces",function(req,res){
  res.sendFile(__dirname+"/Codeforces.html");
});
app.get("/CodeForTheDay",function(req,res){
  res.sendFile(__dirname+"/CodeForTheDay.html");
});

app.get("/HackerRank",function(req,res){
  res.sendFile(__dirname+"/HackrRank.html");
});
app.get("/Leetcode",function(req,res){
  res.sendFile(__dirname+"/LeetCode.html");
});
app.get("/mydoubt",function(req,res){
  res.sendFile(__dirname+"/mydoubt.html");
});
app.get("/history",function(req,res){
  res.sendFile(__dirname+"/history.html");
});
app.get("/particularDoubt",function(req,res){
  res.sendFile(__dirname+"/particular-doubt.html");
});
app.get("/UpcomingContest",function(req,res){
  res.sendFile(__dirname+"/UpcomingContest.html");
});


app.listen(3000,function(req,res){
  console.log("Server running at 3000");
});
