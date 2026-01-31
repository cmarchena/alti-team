module.exports = {
  schema: './prisma/schema.prisma',
  db: {
    url: process.env.DATABASE_URL,
  },
}