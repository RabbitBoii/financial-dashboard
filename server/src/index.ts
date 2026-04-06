import express from "express"
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import recordRoutes from './routes/recordRoutes';
import dashboardRoutes from './routes/dashboardRoutes';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Finance dashboard API is live and running here.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



export default app;