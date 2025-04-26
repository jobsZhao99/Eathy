const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const db = new sqlite3.Database('./rooms.db')

// 初始化表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    description TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    guest_name TEXT,
    check_in TEXT,
    check_out TEXT,
    notes TEXT
  )`)
})

// 获取所有房间
app.get('/rooms', (req, res) => {
  db.all('SELECT * FROM rooms', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// 新增房间
app.post('/rooms', (req, res) => {
  const { name, address, description } = req.body
  db.run(
    'INSERT INTO rooms (name, address, description) VALUES (?, ?, ?)',
    [name, address, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

// 获取所有预订
app.get('/bookings', (req, res) => {
  db.all('SELECT * FROM bookings', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// 新增预订
app.post('/bookings', (req, res) => {
  const { room_id, guest_name, check_in, check_out, notes } = req.body
  db.run(
    'INSERT INTO bookings (room_id, guest_name, check_in, check_out, notes) VALUES (?, ?, ?, ?, ?)',
    [room_id, guest_name, check_in, check_out, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})



// Express.js 写法示例
app.put('/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { guest_name, notes, check_in, check_out } = req.body;
  
    db.run(
      `UPDATE bookings SET guest_name=?, notes=?, check_in=?, check_out=? WHERE id=?`,
      [guest_name, notes, check_in, check_out, id],
      function (err) {
        if (err) {
          return res.status(500).send({ error: 'Database error' });
        }
        res.send({ success: true });
      }
    );
  });
  