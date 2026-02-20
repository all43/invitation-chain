import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { InvitationChain } from '@invitation-chain/lib';
import { createRouter } from './routes.js';

const PORT = process.env.PORT ?? 3001;

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'invitation-chain.db');
const chain = new InvitationChain(dbPath);

const app = express();
app.use(cors());
app.use(express.json());
app.use(createRouter(chain));

// Serve static frontend build in production
const staticDir = path.resolve(process.cwd(), '../web/dist');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
