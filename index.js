const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { default: axios } = require('axios');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xpiyk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        const paymentsCollection = client.db('learn-payment-gateway').collection('payments');
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        app.post("/create-payment", async (req, res) => {
            const paymentInfo = req.body;

            const trxId = new ObjectId().toString();

            const initiateData = {
                store_id: "sakib66ffe3650636d",
                store_passwd: "sakib66ffe3650636d@ssl",
                total_amount: paymentInfo.amount,
                currency: "EUR",
                tran_id: trxId,
                success_url: "http://localhost:5000/success-payment",
                fail_url: "http://localhost:5000/fail",
                cancel_url: "http://localhost:5000/cancel",
                cus_name: "Customer Name",
                cus_email: "cust@yahoo.com",
                cus_add1: "Dhaka",
                cus_add2: "Dhaka",
                cus_city: "Dhaka",
                cus_state: "Dhaka",
                cus_postcode: "1000",
                cus_country: "Bangladesh",
                cus_phone: "01711111111",
                cus_fax: "01711111111",
                shipping_method: "NO",
                // ship_name: "Customer Name",
                // ship_add1: "Dhaka",
                // ship_add2: "Dhaka",
                // ship_city: "Dhaka",
                // ship_state: "Dhaka",
                // ship_postcode: "1000",
                // ship_country: "Bangladesh",
                product_name: "laptop",
                product_category: "laptop",
                product_profile: "general",
                multi_card_name: "mastercard,visacard,amexcard",
                value_a: "ref001_A",
                value_b: "ref002_B",
                value_c: "ref003_C",
                value_d: "ref004_D"
            }

            const response = await axios({
                method: "POST",
                url: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
                data: initiateData,
                headers: {
                    "Content-type": "application/x-www-form-urlencoded",
                },
            })

            const saveData = {
                cus_name: "dummy",
                paymentId: trxId,
                // paymentId: response.data.tran_id,
                amount: paymentInfo.amount,
                status: "Pending",
            }

            const save = await paymentsCollection.insertOne(saveData);

            if (save) {
                res.send({
                    paymentUrl: response.data.GatewayPageURL,
                })
            }

            // console.log(response);
            // res.send({
            //     paymentUrl: response.data.GatewayPageURL,
            // });
        });

        app.post("/success-payment", async (req, res) => {
            const successData = req.body;

            if (successData.status !== "VALID") {
                throw new Error("Unauthorized payment, Invalid Payment");
            }

            const query = {
                paymentId: successData.tran_id
            }

            const update = {
                $set: {
                    status: "Success",
                },
            }

            const updateData = await paymentsCollection.updateOne(query, update);

            console.log("success Data", successData);
            console.log("update Data", updateData);

            res.redirect("http://localhost:3000/success");

        })

        app.post("/fail", async (req, res) => {
            res.redirect("http://localhost:3000/fail");
        })

        app.post("/cancel", async (req, res) => {
            res.redirect("http://localhost:3000/cancel");
        })
    } finally {
        // Ensures that the client will close when you finish/error
        client.close();
    }
}




run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World from payment gateway!')
})


app.listen(port, () => {
    console.log(`payment gateway app listening on port ${port}`)
})