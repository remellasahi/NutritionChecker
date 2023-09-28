const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");
var passwordHash = require('password-hash');

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Filter } = require("firebase-admin/firestore");
var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("web.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs" , {sentence:''});
});

app.post("/signup", (req, res) => {
  console.log(req.body);
  db.collection("newUsers")
    .where(
      Filter.or(
        Filter.where("email", '==', req.body.email),
        Filter.where("name", "==",req.body.name)
      )
    )
    .get()
    .then((docs) => {
      if (docs.size > 0) {
        const str = "Username or Email already exists!! Login with a different id";
        res.render("register.ejs", { sentence: str });
      } else {
        db.collection("newUsers")
          .add({
            name: req.body.name,
            email: req. body.email,
            password: passwordHash.generate(req.body.pwd),
          })
          .then(() => {
            res.render("login.ejs");
          });
      }
    });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/signin", (req, res) => {
  db.collection("newUsers")
    .where("email", "==", req.body.email)
    .get()
    .then((docs) => {
      let check=false;
      docs.forEach((doc) => {
        check=passwordHash.verify(req.body.pwd, doc.data().password);
      }
    );
    if(check){
      res.render("search.ejs");
    }
    else{
      res.send("INVALID CREDENTIALS.\nKindly enter valid details");
    }
});
});

app.get("/search", (req, res) => {
  res.render("search.ejs");
});

app.get("/getinfo", (req, res) => {
  const input = req.query.input;
  var dataArr = [];
  request.get(
    {
      url: 'https://api.api-ninjas.com/v1/nutrition?query=' + input,
      headers: {
        'X-Api-Key': 'Asa4XQ5CZgH5Y+uwa825Iw==NV0aGlh7sXo8V6zu' //'S7L556R5f4nqjWnPrknMsg==2jL1ge9TUIz0JFTk'
      },
    },
    function (error, response, body) {
      if (error) {
        console.error("Error making API request:", error);
        res.send("An error occurred while fetching data from the API.");
      } else if (response.statusCode !== 200) {
        console.error("API request failed with status code:", response.statusCode);
        res.send("API request failed with status code: " + response.statusCode);
      } else {
        const data1 = JSON.parse(body);
        if (Array.isArray(data1) && data1.length > 0) {
          console.log(data1[0].name);
          var a = data1[0].calories;
          var b = data1[0].sugar_g;
          var c = data1[0].carbohydrates_total_g;
          var d = data1[0].fiber_g;
          console.log(a);
          dataArr.push(a);
          dataArr.push(b);
          dataArr.push(c);
          dataArr.push(d);
          res.render("dashboard.ejs", { user: dataArr });
        } else {
          console.log("No data found");
          res.send("No data found for the given input.");
        }
      }
    }
  );
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});