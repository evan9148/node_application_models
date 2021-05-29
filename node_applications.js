const express = require("express");
var jwt = require("jsonwebtoken");
const app = express();
let cookieParser = require('cookie-parser');
app.use(cookieParser())
const bodyParser = require('body-parser')
app.use(bodyParser.json());
// app.use(express.json())
const port = 5000;

// here i am giving connection to the mysql database............

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'Navgurukul123#@!',
        database: 'application_models'
    },
  
});


// creating the table named usermodel.......

knex.schema.hasTable("usermodel").then((value) => {
    if (!value){
        return knex.schema.createTable("usermodel" , (table) => {
            table.increments("id").primary(),
            table.integer("user_id"),
            table.string("name"),
            table.string("email"),
            table.string("password"),
            table.string("role")
        }) 
    }
});


// creating second table named eventmodel....

knex.schema.hasTable("eventmodel").then((value) => {
    if (!value){
        return knex.schema.createTable("eventmodel" , (table) => {
            table.increments("id").primary(),
            table.string("user_email").notNullable();
            table.string("Name").notNullable();
            table.string("description").notNullable();
            table.integer("start_date").notNullable();
            table.integer("end_date").notNullable();
            table.string("city").notNullable();
        }) 
    }
});

// here is my signup api ....
app.post("/signup", (req,res) => {
    // knex.select("*").from("users").then((data) => {
    //     console.log(data)
    // })
    knex.select('email').from('usermodel').where('email', req.body.email)
    .then((data) => {
        if (data.length > 0){
            for (var i=0; i<data.length; i++){
                if (data[i]["email"] == req.body.email){
                    res.send("your email allready used...  ")
                    console.log("your email allready used...  ")
                }
            }
        } else {
            if (data.length === 0) {
                knex("usermodel")
                    .insert({
                            user_id : req.body.user_id,
                            name : req.body.name,
                            email : req.body.email,
                            password : req.body.password,
                            role : req.body.role
                        })
                        .then(() => {
                            console.log("your details are created.... ")
                            res.send("your details are created.... ")
                        }).catch((error) => {
                            console.log("went wrong.... ")
                            res.send(error)
                        })
            }
        }
    }).catch((error) => {
        console.log(error)
        res.send(error)
    })
})


// here is my login api....
app.post("/login" , (req,res) => {
    console.log(req.body.email, " email....")
    console.log(req.body.password)
    knex.select("email","role","password").from("usermodel").where("email" , req.body.email).andWhere("password" , req.body.password)
    .then((data) => {
        console.log(data)
        if (data.length > 0){
            for (var i=0; i<data.length; i++){
                if (data[i]["email"] === req.body.email && data[i]["password"] === req.body.password){
                    jwt.sign({ user: data }, "secret_key", (err, token) => {
                        res.cookie('token',token);
                        res.json(
                            "Auth successful"
                        );
                    });
                }
            }
        }else if (data.length === 0){
                console.log("Invaild email or password...! ")
                res.send("Invaild email or password...!   ")
        }
    })
    .catch((err) => {
        console.log(err)
        res.send(err)
    })
});


// app.post("/eventmodel" , (req,res) => {
//     console.log(req.body)
// })


// here is my api where i am verifying the jwt token .......
app.post("/models" , (req,res) => {
    console.log(req.body)
    const user_token = req.cookies.token
    console.log(user_token,"????")
    jwt.verify(user_token, "secret_key", (err, authData) => {
        console.log(authData)
        if (err) {
            res.sendStatus(403);
            console.log(err)
        } else {
            var eventemail = req.body.user_email
            knex.select("*").from("usermodel").where("email" , eventemail)
            .then((data) => {
                console.log(data)
                if (authData["user"][0]["email"] === eventemail){
                    knex("eventmodel")
                        .insert({
                            user_email : req.body.user_email,
                            Name : req.body.Name,
                            description : req.body.description,
                            start_date : req.body.start_date,
                            end_date : req.body.end_date,
                            city : req.body.city
                        })
                        .then(() => {
                            console.log("created....  ")
                            res.send("created.....  ")
                        }).catch((err) => {
                            console.log(err)
                            res.send(err)
                        })
                }else{
                    console.log("email does not match")
                    res.send("email does not match")
                }
            })
            .catch((error) => {
                console.log(error)
                res.send(error)
            })
        }
    })
})

// here is my update api where i am updating by auth token.....
app.put("/update",(req,res)=>{  
    var eventemail = req.body.user_email
    knex.select("*").from("usermodel").where("email" , eventemail)
    .then((data) => {
        console.log(data)
        const user_token = req.cookies.token
        console.log(user_token,"????")
        jwt.verify(user_token, "secret_key", (err, authData) => {
            if (err){
                res.sendStatus(403);
                console.log(err)    
            }else{
                console.log(authData)
                if (authData["user"][0]["email"] === eventemail){
                    var decoded = jwt.verify(req.headers.authorization, 'secret_key');
                    console.log(decoded)
                    console.log(decoded["user"][0]["email"])
                    console.log(req.body)
                    knex("eventmodel")
                    .where({user_email:decoded["user"][0]["email"]})
                    .update(req.body)
                    .then((data)=>{
                        console.log("update..... ");
                        res.send("updated.... ")
                    })
                    .catch((err)=>{
                        console.log(err);
                        res.send(err)
                    })
                }else{
                    console.log("doesn't match")
                    res.send("doesn't match")
                }
            }
        });
    })
    .catch((err) => {
        console.log(err)
        res.send(err)
    })
})

// my delete api where i will delete the field with auth token......
app.delete("/delete", (req,res) => {
    knex.select("*").from("eventmodel").where("email",)
    .then((data) => {
        const user_token = req.cookies.token
        console.log(user_token,"????")
        var eventemail = req.body.user_email
        jwt.verify(user_token, "secret_key", (err, authData) => {
            if (authData["user"][0]["email"] === eventemail){
                var decoded = jwt.verify(req.headers.authorization, 'secret_key');
                    console.log(decoded)
                    knex('eventmodel')
                    .where({ user_email:decoded["user"][0]["email"]})
                    .del(req.body)
                    .then(() => {
                        console.log("your data have deleted...  ")
                        res.send("your data have deleted!...   ")
                    })
                    .catch((err)=>{
                        console.log(err);
                        res.send(err)
                    })
            }else{
                console.log("email does not match")
                res.send("doesn't match")
            }
        });
    })
    .catch((failed) => {
        console.log(failed)
        res.send(failed)
    })
})


// here is my event api where i will be getting second tables details in ascending order by name and city by query..........
app.get("/event" , (req,res) => {
    knex()
        .select("*")
        .from("eventmodel")
        .then(() => {
            knex('eventmodel').orderBy([{column : req.query.sortby, order : 'asc' }]).then((data) => {
                console.log(data)
                res.send(data)
            })
        })
        .catch((error) => {
            console.log(error)
            res.send(error)
        })
})


// here is my middleware function checking the role of admin to view the second table details....
function middleware_verify_admin (req,res,next) {
    const user_token = req.cookies.token
    console.log(user_token,"????")
    jwt.verify(user_token, "secret_key", (err, authData) => {
        if (err){
            console.log(err)
            res.send(err)
        }else {
            if (authData["user"][0]["role"] == "admin"){
                next();
            }else{
                console.log("the role is not an admin to view details of usermodel..!  ")
                res.send("the role is not an admin to view details of usermodel..!  ")
            }
        }
    })
} 


// api where if the admin role then i am will the data of event table details......
app.get("/admin" , middleware_verify_admin,  (req,res) => {
    knex.select("*").from("usermodel")
    .then((data) => {
        console.log(data)
        res.send(data)
    }).catch((err) => {
        console.log("ERROR...................")
        res.send(err)
    })
})


// api that i am joining the tables from first table to second table by userid.....
app.get("/join_event_model", (req,res) => {
    const user_token = req.cookies.token
    console.log(user_token,"????")
    jwt.verify(user_token, "secret_key", (err, authData) => {
        if (err){
            console.log(err)
            res.sendStatus(403)
        }else{
            if (authData["user"][0]["role"] === "admin"){
                knex.select("*").from("usermodel").innerJoin("eventmodel", "usermodel.email", "eventmodel.user_email")           
                .then((data) => {
                    console.log(data)
                    res.send(data)
                })
                .catch((err) => {
                    console.log(err)
                    res.send(err)
                })
            }
        }
    })
})



// api that i am joining the tables from second table to first table by userid.....
app.get("/join_user_model" , (req,res) => {
    const user_token = req.cookies.token
    console.log(user_token,"????")
    jwt.verify(user_token, "secret_key", (err, authData) => {
        if (err){
            console.log(err)
            res.sendStatus(403)
        }else{
            knex.select("*").from("eventmodel").innerJoin("usermodel", "eventmodel.user_email", "usermodel.email")
            .then((data) => {
                console.log(data)
                res.send(data)
            })
            .catch((err) => {
                console.log(err)
                res.send(err)
            })
        }
    })
})



app.listen(port, () => {
    console.log(`Your server port is running ${port}`)
})