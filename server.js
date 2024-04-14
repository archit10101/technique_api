const express = require('express')
const app = express();
const morgan = require('morgan')
const mysql = require('mysql') 

const https = require('https');
const fs = require('fs');

const options = {
    cert: fs.readFileSync('localhost.pem'),
    key: fs.readFileSync('localhost-key.pem')
  };
  


const bodyparser = require("body-parser");

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended : true}))
app.use(morgan("combined"))
const PORT = process.env.PORT || 8080;

// https.createServer(options, app).listen(PORT, () => {
//     console.log('Server listening on port https://localhost:'+PORT);
//   });

app.listen(PORT, ()=>{
    console.log("listening");
    console.log('Server listening on port http://localhost:'+PORT);

});

const connection = mysql.createConnection({
    host: "aws-technique.cxemeyy82p0i.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: 'ConGloTech',
    database: "techniqueData",
    port: 3306
});

connection.connect((err) => {
    if(err){
        console.log("unable to connect to the database")
    }
    console.log("connected successfully")
})

function queryPromise(sql, values = []){
    return new Promise((resolve, reject) => {
        connection.query(sql,values,(error,results) =>{
            if (error){
                reject(error);
            }else{
                resolve(results);
            }
        })
    });
}


app.post("/users", async (req, res) => {
    try {
        const {id,userName, userPassword, userEmail, firstName, lastName } = req.body;
        if (!userName || !userEmail || !userPassword) {
            throw new Error("User name, email, and password are mandatory");
        }
        const userData = [userName, userPassword, userEmail, firstName, lastName];
        const SQL = "INSERT INTO `user_info` (userName, userPassword,userEmail, firstName, lastName) VALUES (?, ?, ?, ?, ?)";
        const result = await queryPromise(SQL, userData);
        var queryString = "SELECT * FROM user_info WHERE firstName = ?";
        console.log(queryString,userData);

        connection.query(queryString,[firstName], (err, rows, fields) => {
            if (err) {
                console.log("Error fetching users:", err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log("We fetched users successfully");
                res.json(rows); 
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/users/:userName/:password",(req,res) => {
    console.log("the name is "+req.params.userName)
    console.log("the password is "+req.params.password)
    var queryString = "SELECT * FROM user_info WHERE userName= ? AND userPassword = ?";
    console.log(queryString,[req.params.userName,req.params.password]);
    connection.query(queryString,[req.params.userName,req.params.password], (err, rows, fields) => {
        if (err) {
            console.log("Error fetching users:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("We fetched users successfully");
            res.json(rows);
        }
    });
})

app.get("/",(req,res) => {
    console.log("Responding to root route")
    res.send("Hello from ROOOOOT")
})

app.get("/users", (req,res) =>{
    const user1 = {firstName: "Stephen", lastName: "Curry"}
    const user2 = {firstName: "Kevin", lastName: "Durant"}
    res.json([user1,user2])

})