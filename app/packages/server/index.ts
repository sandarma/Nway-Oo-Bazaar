import express from 'express';
import dotenv from 'dotenv';
import router from './routes';

// Load environment variables from .env file and store them in process.env
dotenv.config();

// Create an Express application
const app = express();

// Fix: Netlify Functions pass req.body as a Buffer (from Lambda event).
// Convert it to a string BEFORE express.json() so it can parse it.
app.use((_req, _res, next) => {
   if (Buffer.isBuffer(_req.body)) {
      try {
         _req.body = JSON.parse(_req.body.toString('utf-8'));
      } catch {
         // leave as-is if not JSON
      }
   }
   next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// Use the defined routes
app.use(router);

// Only listen when running directly (local dev)
// When imported by Netlify Function, skip listen
const isLambda = !!process.env.NETLIFY;
if (!isLambda) {
   const port = process.env.PORT || 3000;
   app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
   });
}

export default app;
