import dotenv from 'dotenv'
dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jain_patashala',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  clientOrigins: (process.env.CLIENT_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  pointToRupee: Number(process.env.POINT_TO_RUPEE || 1),
}
