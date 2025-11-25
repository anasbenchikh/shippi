import express from "express"
import axios from "axios"
import orders from "./src/api/orders.route.js"
import users from "./src/api/users.route.js"
import cors from "cors"
import bodyParser from "body-parser"

const app = express();



app.use(cors({origin: 'http://localhost:4200'}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*app.get('/orders', async (req, res, next) => {
    

    const orders = await axios.get('https://cdb3ba-fc.myshopify.com/admin/api/2024-10/orders.json?status=any', {
            headers: {'X-Shopify-Access-Token': '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'}
    }).then((response) => res.json(response.data))
        .catch((error) => console.log(error));

    console.log(orders.data["orders"][0]["current_subtotal_price"]);
    console.log(orders.data["orders"][0]["line_items"][0]["name"]);

    return orders;

    
});*/


// Register api routes

app.use("/api/orders", orders);
app.use("/api/v1/users", users);
app.listen(5000, () => {console.log("Server started at " + 5000)});





