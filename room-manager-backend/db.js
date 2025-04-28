const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./rooms.db')

// 初始化表（可以放在这里，或者每个 routes 初始化一次）
db.serialize(() => {
//   db.run(`CREATE TABLE IF NOT EXISTS guests (...)`)
//   db.run(`CREATE TABLE IF NOT EXISTS bookings (...)`)
//   db.run(`CREATE TABLE IF NOT EXISTS rooms (...)`)
  db.run(`CREATE TABLE IF NOT EXISTS properties (...)`)
})

module.exports = db
