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
        
        const userData = [userName, userPassword, userEmail, firstName, lastName];
        if (!userName || !userEmail || !userPassword) {
            console.log("d",userData);

            throw new Error("User name, email, and password are mandatory");
        }
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

app.post("/courses", async (req, res) => {
    try {
        const { courseName, courseDescription, courseAuthorName, courseAuthorID, courseAuthorImgPath, courseImgPath } = req.body;
        
        const courseData = [courseName, courseDescription, courseAuthorName, courseAuthorID, courseAuthorImgPath, courseImgPath];
        if (!courseName || !courseDescription || !courseAuthorName || !courseAuthorID) {
            throw new Error("Course name, description, author name, and author ID are mandatory");
        }
        const SQL = "INSERT INTO `courses` (courseName, courseDescription, courseAuthorName, courseAuthorID, courseAuthorImgPath, courseImgPath) VALUES (?, ?, ?, ?, ?, ?)";
        const result = await queryPromise(SQL, courseData);
        const queryString = "SELECT * FROM courses WHERE courseID = ?";
        connection.query(queryString, [result.insertId], (err, rows, fields) => {
            if (err) {
                console.log("Error fetching course:", err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log("Inserted course successfully");
                res.json(rows[0]); 
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/courses/courseID/:courseID", (req, res) => {
    const courseID = req.params.courseID;
    const queryString = "SELECT * FROM courses WHERE courseID = ?";
    connection.query(queryString, [courseID], (err, rows, fields) => {
        if (err) {
            console.log("Error fetching course:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (rows.length > 0) {
                console.log("Fetched course successfully");
                res.json(rows[0]);
            } else {
                res.status(404).json({ error: 'Course not found' });
            }
        }
    });
});

app.get("/courses/tag/:tag_name", (req, res) => {
    const tagName = req.params.tag_name;
    const getTagIDQuery = "SELECT tagID FROM tag_info WHERE tag_name = ?";
    
    connection.query(getTagIDQuery, [tagName], (err, tagRows, fields) => {
        if (err) {
            console.log("Error fetching tag ID:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (tagRows.length === 0) {
                // Tag not found, return empty response or appropriate error
                console.log("Tag not found:", tagName);
                res.status(404).json({ error: 'Tag not found' });
            } else {
                const tagID = tagRows[0].tagID;
                const getCoursesQuery = `
                    SELECT courses.*
                    FROM courses
                    INNER JOIN course_tags_relation ON courses.courseID = course_tags_relation.courseID
                    WHERE course_tags_relation.tagID = ?`;
                
                connection.query(getCoursesQuery, [tagID], (err, courseRows, fields) => {
                    if (err) {
                        console.log("Error fetching courses with tag:", err);
                        res.status(500).json({ error: 'Internal Server Error' });
                    } else {
                        console.log("Fetched courses with tag successfully");
                        res.json(courseRows);
                    }
                });
            }
        }
    });
});

app.get("/courses", (req, res) => {
    const queryString = "SELECT * FROM courses";
    connection.query(queryString, (err, rows, fields) => {
        if (err) {
            console.log("Error fetching courses:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("Fetched all courses successfully");
            res.json(rows);
        }
    });
});

app.get("/courses/search/:searchString", (req, res) => {
    const searchString = "%" + req.params.searchString + "%"; // Add wildcards to search string
    const queryString = `
        SELECT *
        FROM courses
        WHERE courseName LIKE ?`;
    connection.query(queryString, [searchString], (err, rows, fields) => {
        if (err) {
            console.log("Error searching for courses:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("Courses found successfully");
            res.json(rows);
        }
    });
});
app.get("/tags/:tag_name", (req, res) => {
    const tagName = req.params.tag_name;
    const queryString = "SELECT tagID FROM tag_info WHERE tag_name = ?";
    
    connection.query(queryString, [tagName], (err, rows, fields) => {
        if (err) {
            console.log("Error fetching tag IDs:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("Tag IDs fetched successfully");
            res.json(rows);
        }
    });
});
