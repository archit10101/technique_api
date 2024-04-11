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

https.createServer(options, app).listen(PORT, () => {
    console.log('Server listening on port https://localhost:'+PORT);
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
        // Destructure values from req.body
        const { user_ID, user_name, user_email, user_password, user_phonenumber, first_name, last_name } = req.body;

        // Check if required fields are provided
        if (!user_name || !user_email || !user_password) {
            throw new Error("User name, email, and password are mandatory");
        }

        // Create an array with user data
        const userData = [user_ID, user_name, user_email, user_password, user_phonenumber, first_name, last_name];

        // SQL query to insert user into 'user_info' table
        const SQL = "INSERT INTO `user_info` (user_ID, user_name, user_email, user_password, user_phonenumber, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)";

        // Execute the query
        const result = await queryPromise(SQL, userData);

        // Respond with the newly created user's data
        res.json({
            id: result.insertId,
            user_ID,
            user_name,
            user_email,
            user_password: '********', // You might not want to send the password back
            user_phonenumber,
            first_name,
            last_name,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/users/:id",(req,res) => {
    console.log("the id is "+req.params.id)
    

    var queryString = "SELECT * FROM user_info WHERE first_name = ?";
    console.log(queryString,[req.params.id]);
    connection.connect((err) => {
        if(err){
            console.log("unable to connect to the database")
        }
        console.log("connected successfully")
    });
    connection.query(queryString,[req.params.id], (err, rows, fields) => {
        if (err) {
            console.log("Error fetching users:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("We fetched users successfully");
            res.json(rows);  // Send the response here
        }
        // Close the connection after sending the response or handling the error
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