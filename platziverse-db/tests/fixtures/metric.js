'use strict'

const agentFixtures = require('./agent')

const metric = {
  id: 1,
  agentId: 1,
  type: 'CPU',
  value: '68',
  createdAt: new Date(),
  updatedAt: new Date()
}

const metrics = [
  metric,
  extend(metric, { id: 2, type: 'MEMORY', value: '18' }),
  extend(metric, { id: 3, type: 'DISK', value: '45' }),
  extend(metric, { id: 4, agentId: 2, type: 'CACHE', value: '67' }),
  extend(metric, { id: 5, agentId: 2, type: 'MEMORY', value: '76' }),
  extend(metric, { id: 6, value: '34' })
]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

function findByAgentUuid (uuid) {
  const agent = agentFixtures.byUuid(uuid)
  const metricsAgent = metrics.filter(a => a.agentId === agent.id)
  return metricsAgent.reduce((p, c) => {
    if (!p.includes(c.type)) p.push(c.type)
    return p
  }, [])
}

function findByTypeAgentUuid (type, uuid) {
  const agent = agentFixtures.byUuid(uuid)
  const metricsTypeAgent = metrics.filter(a => {
    return (a.agentId === agent.id && a.type === type)
  })
  return metricsTypeAgent.sort(function compare (a, b) {
    var dateA = a.createdAt
    var dateB = b.createdAt
    return dateA - dateB
  }).slice(0, 19)
}

module.exports = {
  single: metric,
  all: metrics,
  findByAgentUuid,
  findByTypeAgentUuid
}
