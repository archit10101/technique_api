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

app.put("/users/:userId", (req, res) => {
    const userId = req.params.userId;
    const { id,userName, userPassword, userEmail, userFirstName, userLastName } = req.body;

    // Check if all required fields are provided
    if (!userName || !userPassword || !userEmail || !userFirstName || !userLastName) {
        console.log("check: ",[userName, userPassword, userEmail, userFirstName, userLastName, userId])
        return res.status(400).json({ error: "All fields (userName, userPassword, userEmail, userFirstName, userLastName) are required" });
    }

    // Update query
    const updateQuery = "UPDATE user_info SET userName = ?, userPassword = ?, userEmail = ?, userFirstName = ?, userLastName = ? WHERE userId = ?";

    connection.query(updateQuery, [userName, userPassword, userEmail, userFirstName, userLastName, userId], (err, result) => {
        if (err) {
            console.log("Error updating user:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("User updated successfully");
            res.status(200).json({ message: "User updated successfully", userId });
        }
    });
});


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
        console.log(courseData);
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
                res.json(rows);
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
// Handle GET request to fetch all courses by author
app.get("/courses/author/:author", (req, res) => {
    const author = req.params.author;
    const queryString = "SELECT * FROM courses WHERE courseAuthorName = ?";
    
    connection.query(queryString, [author], (err, rows, fields) => {
        if (err) {
            console.log("Error fetching courses by author:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log("Fetched courses by author successfully");
            res.json(rows);
        }
    });
});
app.get("/enrolled-courses/:userID/:courseID", (req, res) => {
    const userID = req.params.userID;
    const courseID = req.params.courseID;

    // Query to check if there is a row with the given userID and courseID
    const queryString = "SELECT * FROM user_enrolled_courses WHERE userID = ? AND enrolled_courseID = ?";

    connection.query(queryString, [userID, courseID], (err, rows, fields) => {
        if (err) {
            console.log("Error fetching enrolled courses:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (rows.length > 0) {
                // If a row exists, return the data
                console.log("Found enrolled course for user:", userID, "and course:", courseID);
                res.json(rows[0]); // Assuming you want to return the first matching row
            } else {
                console.log("No enrolled course found for user:", userID, "and course:", courseID);
                res.status(404).json({ message: 'Enrolled course not found' });
            }
        }
    });
});

app.post("/enroll-course/:userID/:courseID", (req, res) => {
    const { userID, courseID } = req.params;

    if (!userID || !courseID) {
        return res.status(400).json({ error: "UserID and CourseID are required" });
    }

    // Check if the user is already enrolled in the course
    const checkQuery = "SELECT * FROM user_enrolled_courses WHERE userID = ? AND enrolled_courseID = ?";
    connection.query(checkQuery, [userID, courseID], (err, rows, fields) => {
        if (err) {
            console.log("Error checking enrollment:", err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (rows.length > 0) {
            // User is already enrolled
            return res.status(400).json({ error: "User is already enrolled in this course" });
        } else {
            // Insert into user_enrolled_courses with current date and time
            const insertQuery = "INSERT INTO user_enrolled_courses (userID, enrolled_courseID, date_time) VALUES (?, ?, NOW())";
            connection.query(insertQuery, [userID, courseID], (err, result) => {
                if (err) {
                    console.log("Error enrolling user in course:", err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                console.log("Enrolled user in course successfully");
                res.status(200).json({ message: "Enrolled user in course successfully", userID, courseID });
            });
        }
    });
});
