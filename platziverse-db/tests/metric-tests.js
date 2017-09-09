'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')

let config = {
  logging () {}
}

let uuid = 'yyy-yyy-yyy'
let type = 'CPU'
let AgentStub = null
let MetricStub = null
let db = null
let sandbox = null

let uuidArgs = {
  where: { uuid }
}

let metricUuidArgs = {
  attributes: [ 'type' ],
  group: [ 'type' ],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}

let metricTypeUuidArgs = {
  attributes: [ 'id', 'type', 'value', 'createdAt' ],
  where: { type },
  limit: 20,
  order: [[ 'createdAt', 'DESC' ]],
  include: [{
    attributes: [],
    model: AgentStub,
    where: { uuid }
  }],
  raw: true
}

let newMetric = {
  agentId: 1,
  type: 'CPU',
  value: '50'
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  AgentStub = {
    hasMany: sandbox.spy()
  }
  MetricStub = {
    belongsTo: sandbox.spy()
  }

  // Model Agent findOne Stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model Metric create Stub
  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(newMetric).returns(Promise.resolve({
    toJSON () { return newMetric }
  }))

  metricUuidArgs.include[0].model = AgentStub
  metricTypeUuidArgs.include[0].model = AgentStub
  // Model Metric findAll Stub
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs().returns(Promise.resolve(metricFixtures.all))
  MetricStub.findAll.withArgs(metricUuidArgs).returns(Promise.resolve(metricFixtures.findByAgentUuid(uuid)))
  MetricStub.findAll.withArgs(metricTypeUuidArgs).returns(Promise.resolve(metricFixtures.findByTypeAgentUuid(type, uuid)))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Metric, 'Metric service should exist')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Metric#create', async t => {
  let metric = await db.Metric.create(uuid, newMetric)

  t.true(AgentStub.findOne.called, 'Agent findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'Agent findOne should be called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with uuid args')

  t.true(MetricStub.create.called, 'Metric create should be called on model')
  t.true(MetricStub.create.calledOnce, 'Metric create should be called once')
  t.true(MetricStub.create.calledWith(newMetric), 'Metric create should be called with specified args')

  t.deepEqual(metric, newMetric, 'metric should be the same')
})

test.serial('Metric#findByAgentUuid', async t => {
  let metrics = await db.Metric.findByAgentUuid(uuid)
  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricStub.findAll.calledWith(metricUuidArgs), 'findAll should be called with specified args')

  t.deepEqual(metrics, metricFixtures.findByAgentUuid(uuid), 'metric should be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  let metrics = await db.Metric.findByTypeAgentUuid(type, uuid)
  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricStub.findAll.calledWith(metricTypeUuidArgs), 'findAll should be called with specified args')

  t.deepEqual(metrics, metricFixtures.findByTypeAgentUuid(type, uuid), 'metric should be the same')
})
