import express from "express"
import orders from "./src/api/orders.route.js"
import users from "./src/api/users.route.js"
import cors from "cors"
import bodyParser from "body-parser"

const app = express();



app.use(cors({origin: 'http://localhost:4200'}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


// Register api routes

app.use("/api/orders", orders);
app.use("/api/v1/users", users);
app.listen(5000, () => {console.log("Server started at " + 5000)});





