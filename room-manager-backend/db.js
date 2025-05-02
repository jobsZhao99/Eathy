// db.js
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./rooms.db')

// 初始化所有表，只初始化一次
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    description TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    property_id INTEGER NOT NULL,  -- 指向 properties
    unit_id INTEGER,  -- 可为 NULL，表示无单元
    description TEXT,
    FOREIGN KEY (property_id) REFERENCES properties(id)
    FOREIGN KEY (unit_id) REFERENCES units(id)

  )`)

  db.run(`CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    property_id INTEGER,  -- 指向 properties
    description TEXT,
    FOREIGN KEY (property_id) REFERENCES properties(id)
  )`)


  db.run(`CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    guest_id INTEGER,
    check_in TEXT,
    check_out TEXT,
    notes TEXT,
    confirmed_date TEXT,
    confirmation_code TEXT,
    night INTEGER,
    sum_days INTEGER,
    net_rate REAL,
    total_rent REAL,
    daily_rent REAL,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (guest_id) REFERENCES guests(id)
  )`)
})

module.exports = db
