import express from 'express';
import cors from 'cors';
import markdownRoutes from './routes/markdown';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/markdown', markdownRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
