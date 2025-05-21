import express from 'express'
import cors from 'cors'
import stockRoutes from './routes/stockRoutes'



const PORT = process.env.PORT
const app = express();
app.use(cors());



app.use('/api/stocks',stockRoutes)

app.listen(PORT,()=>{
    console.log(`Backend Server is running on ${PORT} `);
})

