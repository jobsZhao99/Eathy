const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取所有预订
router.get('/', (req, res) => {
  db.all('SELECT * FROM bookings', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// 新增预订
router.post('/', (req, res) => {
  const {
    room_id,
    guest_id,
    check_in,
    check_out,
    notes,
    confirmed_date,
    confirmation_code,
    night,
    sum_days,
    net_rate,
    total_rent,
    daily_rent
  } = req.body

  db.run(
    `INSERT INTO bookings
    (room_id, guest_id, check_in, check_out, notes, confirmed_date, confirmation_code, night, sum_days, net_rate, total_rent, daily_rent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [room_id, guest_id, check_in, check_out, notes, confirmed_date, confirmation_code, night, sum_days, net_rate, total_rent, daily_rent],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

// 编辑预订
router.put('/:id', (req, res) => {
  const { id } = req.params
  const {
    room_id,
    guest_id,
    check_in,
    check_out,
    notes,
    confirmed_date,
    confirmation_code,
    night,
    sum_days,
    net_rate,
    total_rent,
    daily_rent
  } = req.body

  db.run(
    `UPDATE bookings SET
      room_id = ?, 
      guest_id = ?, 
      check_in = ?, 
      check_out = ?, 
      notes = ?,
      confirmed_date = ?,
      confirmation_code = ?,
      night = ?,
      sum_days = ?,
      net_rate = ?,
      total_rent = ?,
      daily_rent = ?
    WHERE id = ?`,
    [room_id, guest_id, check_in, check_out, notes, confirmed_date, confirmation_code, night, sum_days, net_rate, total_rent, daily_rent, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ success: true })
    }
  )
})

// 删除预订
router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM bookings WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ success: true })
  })
})

module.exports = router
