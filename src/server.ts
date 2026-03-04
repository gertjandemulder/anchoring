import express, {Express} from 'express';

import bodyParser from "body-parser";
import cors from 'cors';
import { config } from './config'
import { Explorer } from './controllers/explorer';
import { Verifier } from './controllers/verifier';
import { renderExplorerPage } from './views/explorer';

const app: Express = express();
app.use(cors(config.cors))
app.use(bodyParser.json())
app.use((req, res, next) => {
    const {method, url} = req
    console.log(`${method}\t${url}`)
    next()
})
app.post('/verify', async (req,res)=>{
    const { verifiableCredential } = req.body;

    try {
        const verifier = new Verifier();
        const vr = await verifier.verifyVc(verifiableCredential)
        const {subjectMatches, anchored, anchor } = vr

        const chainVerificationResult = {
            verified: subjectMatches && anchored,
            anchor
        }
        res.send(chainVerificationResult);
    } catch (error) {
        res.send({ error });
    }
})

app.get('/explorer', (_req, res) => {
    res.type('html').send(renderExplorerPage());
})

app.get('/explorer/data', async (_req, res) => {
    try {
        const explorer = new Explorer();
        const overview = await explorer.getOverview();
        res.send(overview);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).send({ error: message });
    }
})


app.listen(config.port, () => {
    console.log(`⚡️[${config.name}]: Server is running at http://localhost:${config.port}`);
})
