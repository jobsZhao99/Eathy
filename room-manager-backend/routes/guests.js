const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取所有租客
router.get('/', (req, res) => {
  db.all('SELECT * FROM guests', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// 获取单个租客
router.get('/:id', (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM guests WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!row) return res.status(404).json({ error: 'Guest not found' })
    res.json(row)
  })
})

// 新增租客
router.post('/', (req, res) => {
  const { name, phone, notes } = req.body
  db.run(
    'INSERT INTO guests (name, phone, notes) VALUES (?, ?, ?)',
    [name, phone, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

// 编辑租客
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, phone, notes } = req.body
  db.run(
    'UPDATE guests SET name = ?, phone = ?, notes = ? WHERE id = ?',
    [name, phone, notes, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ success: true })
    }
  )
})

// 删除租客
router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM guests WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ success: true })
  })
})

module.exports = router
