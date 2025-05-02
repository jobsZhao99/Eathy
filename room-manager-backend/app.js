const express = require('express')
const cors = require('cors')
const app = express()
const PORT = 3000

const db = require('./db')  // 引入统一的 db

app.use(cors())
app.use(express.json())

// 注册各个功能模块的路由
app.use('/properties', require('./routes/properties'))
app.use('/rooms', require('./routes/rooms'))
app.use('/guests', require('./routes/guests'))
app.use('/bookings', require('./routes/bookings'))
app.use('/units', require('./routes/units'))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
