import express from 'express';
import { getStockItemsForCompany } from '../controllers/stockController';

const router = express.Router();

router.get('/items', async(req,res)=>{
    const result = await getStockItemsForCompany();
    console.log(result);
});

export default router;
