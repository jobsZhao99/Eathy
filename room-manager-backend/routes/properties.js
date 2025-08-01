const express = require('express')
const router = express.Router()
const db = require('../db')  // 引入db.js统一管理数据库连接



/** 获取所有楼栋 */
router.get('/', (req, res) => {
  db.all('SELECT * FROM properties', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

/** 获取单个楼栋 */
router.get('/:id', (req, res) => {
  const { id } = req.params
  db.get('SELECT * FROM properties WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!row) return res.status(404).json({ error: 'Property not found' })
    res.json(row)
  })
})

/** 新增楼栋 */
router.post('/', (req, res) => {
  const { name, address, description } = req.body
  db.run(
    'INSERT INTO properties (name, address, description) VALUES (?, ?, ?)',
    [name, address, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID })
    }
  )
})

/** 编辑楼栋 */
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, address, description } = req.body
  db.run(
    'UPDATE properties SET name = ?, address = ?, description = ? WHERE id = ?',
    [name, address, description, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ success: true })
    }
  )
})

/** 删除楼栋 */
router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM properties WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ success: true })
  })
})

module.exports = router
