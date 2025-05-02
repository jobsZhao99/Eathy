const express = require('express')
const router = express.Router()
const db = require('../db')


/** 获取所有房间 */
router.get('/', (req, res) => {
  db.all('SELECT * FROM units', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

/** 获取单个房间 */
router.get('/:id', (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM units WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!row) return res.status(404).json({ error: 'unit not found' })
    res.json(row)
  })
})

/** 新增房间 */
router.post('/', (req, res) => {
  const { name, description, property_id } = req.body
  db.run(
    'INSERT INTO units (name, description, property_id) VALUES (?, ?, ?)',
    [name, description, property_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

/** 编辑房间 */
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, description, property_id } = req.body
  db.run(
    'UPDATE units SET name = ?, description = ?, property_id = ? WHERE id = ?',
    [name, description, property_id, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      if (this.changes === 0) return res.status(404).json({ error: 'unit not found' })
      res.json({ success: true })
    }
  )
})

/** 删除房间 */
router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM units WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    if (this.changes === 0) return res.status(404).json({ error: 'unit not found' })
    res.json({ success: true })
  })
})

module.exports = router
