import express from 'express';
import cards from './cards.mjs'
import charts from './charts.mjs'
import tables from './tables.mjs';
import buttons from "./buttons.mjs";
import selectors from "./Selectors.mjs";
import searches from "./searches.mjs";

const router = express.Router();

router.use('/cards', cards);
router.use('/charts', charts);
router.use('/tables', tables);
router.use('/buttons', buttons);
router.use('/selectors', selectors);
router.use('/searches', searches);

//Routes
router.get('/test', (req, res) => {
    res.send('Manager dashboard route working');
});

export default router;