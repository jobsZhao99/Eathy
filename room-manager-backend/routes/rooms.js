const express = require('express')
const router = express.Router()
const db = require('../db')


/** 获取所有房间 */
router.get('/', (req, res) => {
  db.all('SELECT * FROM rooms', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

/** 获取单个房间 */
router.get('/:id', (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM rooms WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!row) return res.status(404).json({ error: 'Room not found' })
    res.json(row)
  })
})

/** 新增房间 */
router.post('/', (req, res) => {
  const { name, property_id, unit_id, description } = req.body
  db.run(
    'INSERT INTO rooms (name, property_id,unit_id,description) VALUES (?, ?, ?, ?)',
    [name, property_id, unit_id, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

/** 编辑房间 */
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, property_id, unit_id,description } = req.body
  db.run(
    'UPDATE rooms SET name = ?, property_id = ?, unit_id = ?, description = ? WHERE id = ?',
    [name, property_id, unit_id, description, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      if (this.changes === 0) return res.status(404).json({ error: 'Room not found' })
      res.json({ success: true })
    }
  )
})

/** 删除房间 */
router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM rooms WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    if (this.changes === 0) return res.status(404).json({ error: 'Room not found' })
    res.json({ success: true })
  })
})

module.exports = router
