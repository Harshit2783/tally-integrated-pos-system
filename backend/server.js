import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectToTally } from './config/tally.config.js';


const app = express();
//cross-origin
app.use(cors())
dotenv.config()

//json parsing
app.use(express.json())
const PORT = process.env.PORT || 3000


app.get("/",(req,res)=>{
    console.log('All OK');
    res.send("ALL OK")
})
//checking connection to Tally Prime
const connectionStatus = await connectToTally();
console.log(connectionStatus);

if(connectionStatus)
{
    //tally is connected successfully....

    //NOW CALL TALLY-RELATED APISN HERE...
}


app.listen(PORT,()=>{
    console.log(`Node.js Backend Server is listening on Port ${PORT}`);
})
